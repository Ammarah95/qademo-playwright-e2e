#!/usr/bin/env node
/**
 * Builds a static test-results dashboard (site/index.html) from Playwright's JSON report.
 *
 * Usage: node scripts/generate-dashboard.js [results.json] [outDir] [history.json]
 *
 * - Summarises the latest run (pass / fail / flaky / skipped, duration, per-suite, per-browser)
 * - Keeps a rolling history (last 30 runs) so the dashboard shows a pass-rate trend.
 *   In CI the previous history.json is pulled from the gh-pages branch before this runs.
 * - Links to the Playwright HTML report and the Allure report published alongside it.
 */
const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[2] || 'reports/results.json';
const outDir = process.argv[3] || 'site';
const historyFile = process.argv[4] || path.join(outDir, 'history.json');
const MAX_HISTORY = 30;
// Strips terminal colour codes (ESC[...m) from Playwright error messages.
const ANSI_COLORS = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

if (!fs.existsSync(resultsFile)) {
  console.error(`No results file at ${resultsFile}. Run the tests first.`);
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

// ---------- flatten Playwright JSON report ----------
const tests = [];
function walk(suite, trail) {
  const here = suite.title ? [...trail, suite.title] : trail;
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const last = t.results[t.results.length - 1] || {};
      tests.push({
        file: spec.file || here[0],
        suite: here.slice(1).join(' › ') || here[0],
        title: spec.title,
        tags: spec.tags || [],
        project: t.projectName,
        status: t.status, // expected | unexpected | flaky | skipped
        outcome: last.status, // passed | failed | timedOut | skipped
        duration: t.results.reduce((a, r) => a + (r.duration || 0), 0),
        retries: Math.max(0, t.results.length - 1),
        error: (last.error && (last.error.message || '').replace(ANSI_COLORS, '').split('\n')[0]) || '',
        knownDefect: (t.annotations || []).some((a) => a.type === 'known defect' || a.type === 'fail'),
      });
    }
  }
  for (const child of suite.suites || []) walk(child, here);
}
for (const s of report.suites || []) walk(s, []);

const count = (pred) => tests.filter(pred).length;
const summary = {
  total: tests.length,
  passed: count((t) => t.status === 'expected' && t.outcome !== 'skipped'),
  failed: count((t) => t.status === 'unexpected'),
  flaky: count((t) => t.status === 'flaky'),
  skipped: count((t) => t.status === 'skipped' || t.outcome === 'skipped'),
  knownDefects: count((t) => t.knownDefect),
  durationMs: Math.round(report.stats?.duration || tests.reduce((a, t) => a + t.duration, 0)),
  startTime: report.stats?.startTime || new Date().toISOString(),
};
const executed = summary.total - summary.skipped;
summary.passRate = executed ? +(((summary.passed + summary.flaky) / executed) * 100).toFixed(1) : 0;

// ---------- history ----------
let history = [];
if (fs.existsSync(historyFile)) {
  try {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  } catch {
    history = [];
  }
}
const run = {
  id: process.env.GITHUB_RUN_NUMBER || String(history.length + 1),
  url:
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : '',
  branch: process.env.GITHUB_REF_NAME || 'local',
  commit: (process.env.GITHUB_SHA || '').slice(0, 7),
  event: process.env.GITHUB_EVENT_NAME || 'local',
  ...summary,
};
history = [...history.filter((h) => h.id !== run.id), run].slice(-MAX_HISTORY);

// ---------- groupings ----------
function groupBy(key) {
  const map = {};
  for (const t of tests) {
    const k = t[key] || '—';
    map[k] ??= { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    if (t.status === 'unexpected') map[k].failed++;
    else if (t.status === 'flaky') map[k].flaky++;
    else if (t.status === 'skipped' || t.outcome === 'skipped') map[k].skipped++;
    else map[k].passed++;
  }
  return map;
}
const byProject = groupBy('project');
const byFile = groupBy('file');

// ---------- render ----------
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDur = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s` : `${(ms / 1000).toFixed(1)}s`);
const badge = (t) => {
  if (t.status === 'unexpected') return '<span class="pill fail">failed</span>';
  if (t.status === 'flaky') return '<span class="pill flaky">flaky</span>';
  if (t.status === 'skipped' || t.outcome === 'skipped') return '<span class="pill skip">skipped</span>';
  if (t.knownDefect) return '<span class="pill defect">known defect</span>';
  return '<span class="pill pass">passed</span>';
};
const stackRow = (name, g) => {
  const total = g.passed + g.failed + g.flaky + g.skipped || 1;
  const seg = (n, cls) => (n ? `<span class="${cls}" style="width:${(n / total) * 100}%" title="${n}"></span>` : '');
  return `<div class="row"><div class="label">${esc(name)}</div><div class="bar">${seg(g.passed, 'b-pass')}${seg(g.flaky, 'b-flaky')}${seg(g.failed, 'b-fail')}${seg(g.skipped, 'b-skip')}</div><div class="num">${g.passed}/${total}</div></div>`;
};

// trend chart (SVG)
const W = 760,
  H = 150,
  P = 22,
  PL = 44; // left padding for y-axis labels
const pts = history.map((h, i) => {
  const x = history.length === 1 ? (W + PL) / 2 : PL + (i * (W - PL - P)) / (history.length - 1);
  const y = H - P - ((h.passRate || 0) / 100) * (H - 2 * P);
  return { x, y, h };
});
const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const trendSvg = `
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pass rate over the last ${history.length} runs">
  ${[0, 50, 100]
    .map((v) => {
      const y = H - P - (v / 100) * (H - 2 * P);
      return `<line x1="${PL}" x2="${W - P}" y1="${y}" y2="${y}" class="grid"/><text x="${PL - 8}" y="${y + 4}" class="axis" text-anchor="end">${v}%</text>`;
    })
    .join('')}
  <polyline points="${line}" class="trend"/>
  ${pts
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="4" class="${p.h.failed ? 'dot-fail' : 'dot-pass'}"><title>Run #${esc(p.h.id)} · ${p.h.passRate}% · ${p.h.passed} passed, ${p.h.failed} failed</title></circle>`,
    )
    .join('')}
</svg>`;

const sorted = [...tests].sort((a, b) => {
  const rank = (t) => (t.status === 'unexpected' ? 0 : t.status === 'flaky' ? 1 : t.knownDefect ? 2 : 3);
  return rank(a) - rank(b) || a.file.localeCompare(b.file);
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QA Demo · E2E Test Dashboard</title>
<style>
  :root{--bg:#0f1115;--card:#171a21;--line:#262b36;--text:#e6e8ee;--muted:#8b93a7;--pass:#22c55e;--fail:#ef4444;--flaky:#f59e0b;--skip:#64748b;--defect:#a78bfa;--accent:#38bdf8}
  @media (prefers-color-scheme: light){:root{--bg:#f6f7f9;--card:#fff;--line:#e5e7eb;--text:#111827;--muted:#6b7280}}
  *{box-sizing:border-box} body{margin:0;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--text)}
  .wrap{max-width:1100px;margin:0 auto;padding:28px 20px 60px}
  header{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between;margin-bottom:22px}
  h1{font-size:22px;margin:0} .sub{color:var(--muted)} a{color:var(--accent);text-decoration:none} a:hover{text-decoration:underline}
  .links a{display:inline-block;border:1px solid var(--line);border-radius:8px;padding:6px 12px;margin-left:6px;background:var(--card)}
  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
  .kpi .v{font-size:26px;font-weight:650;font-variant-numeric:tabular-nums} .kpi .k{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .v.pass{color:var(--pass)} .v.fail{color:var(--fail)} .v.flaky{color:var(--flaky)} .v.defect{color:var(--defect)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px} @media(max-width:800px){.grid2{grid-template-columns:1fr}}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:12px}
  .card h2{font-size:14px;margin:0 0 12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  svg{width:100%;height:auto} .grid{stroke:var(--line)} .axis{fill:var(--muted);font-size:11px}
  .trend{fill:none;stroke:var(--accent);stroke-width:2} .dot-pass{fill:var(--pass)} .dot-fail{fill:var(--fail)}
  .row{display:grid;grid-template-columns:170px 1fr 54px;gap:10px;align-items:center;margin:7px 0}
  .label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .num{text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}
  .bar{display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--line)} .bar span{display:block;height:100%}
  .b-pass{background:var(--pass)} .b-fail{background:var(--fail)} .b-flaky{background:var(--flaky)} .b-skip{background:var(--skip)}
  table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}
  th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase}
  td.dur{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted);white-space:nowrap}
  .err{color:var(--fail);font-size:12px;margin-top:2px} .tag{font-size:11px;color:var(--muted);margin-right:4px}
  .pill{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600;white-space:nowrap}
  .pill.pass{background:color-mix(in srgb,var(--pass) 18%,transparent);color:var(--pass)}
  .pill.fail{background:color-mix(in srgb,var(--fail) 18%,transparent);color:var(--fail)}
  .pill.flaky{background:color-mix(in srgb,var(--flaky) 18%,transparent);color:var(--flaky)}
  .pill.skip{background:color-mix(in srgb,var(--skip) 22%,transparent);color:var(--muted)}
  .pill.defect{background:color-mix(in srgb,var(--defect) 18%,transparent);color:var(--defect)}
  input[type=search]{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--text);margin-bottom:10px}
  footer{color:var(--muted);font-size:12px;margin-top:20px}
</style>
</head>
<body><div class="wrap">
<header>
  <div>
    <h1>QA Demo · E2E Test Dashboard</h1>
    <div class="sub">Playwright + JavaScript · Page Object Model · target <a href="https://qademo.com">qademo.com</a><br>
    Run #${esc(run.id)} · ${esc(run.branch)}${run.commit ? ` @ ${esc(run.commit)}` : ''} · ${esc(new Date(summary.startTime).toUTCString())}
    ${run.url ? ` · <a href="${esc(run.url)}">CI run</a>` : ''}</div>
  </div>
  <div class="links"><a href="playwright-report/index.html">Playwright report</a><a href="allure/index.html">Allure report</a></div>
</header>

<section class="kpis">
  <div class="kpi"><div class="k">Pass rate</div><div class="v ${summary.failed ? 'fail' : 'pass'}">${summary.passRate}%</div></div>
  <div class="kpi"><div class="k">Total</div><div class="v">${summary.total}</div></div>
  <div class="kpi"><div class="k">Passed</div><div class="v pass">${summary.passed}</div></div>
  <div class="kpi"><div class="k">Failed</div><div class="v fail">${summary.failed}</div></div>
  <div class="kpi"><div class="k">Flaky</div><div class="v flaky">${summary.flaky}</div></div>
  <div class="kpi"><div class="k">Known defects</div><div class="v defect">${summary.knownDefects}</div></div>
  <div class="kpi"><div class="k">Duration</div><div class="v">${fmtDur(summary.durationMs)}</div></div>
</section>

<div class="card"><h2>Pass-rate trend · last ${history.length} run${history.length === 1 ? '' : 's'}</h2>${trendSvg}</div>

<div class="grid2">
  <div class="card"><h2>By browser / project</h2>${Object.entries(byProject).map(([k, g]) => stackRow(k, g)).join('')}</div>
  <div class="card"><h2>By spec file</h2>${Object.entries(byFile).map(([k, g]) => stackRow(k.replace(/^.*[\\/]/, ''), g)).join('')}</div>
</div>

<div class="card"><h2>Tests</h2>
<input type="search" id="q" placeholder="Filter by title, file, tag or status…" aria-label="Filter tests">
<table id="t"><thead><tr><th>Status</th><th>Test</th><th>Project</th><th style="text-align:right">Time</th></tr></thead><tbody>
${sorted
  .map(
    (t) => `<tr data-s="${esc((t.title + ' ' + t.file + ' ' + t.suite + ' ' + t.tags.join(' ') + ' ' + t.project + ' ' + t.status).toLowerCase())}">
<td>${badge(t)}</td>
<td><div>${esc(t.suite ? t.suite + ' › ' : '')}<strong>${esc(t.title)}</strong></div>
<div>${t.tags.map((g) => `<span class="tag">${esc(g)}</span>`).join('')}<span class="tag">${esc(t.file)}</span>${t.retries ? `<span class="tag">retries: ${t.retries}</span>` : ''}</div>
${t.status === 'unexpected' && t.error ? `<div class="err">${esc(t.error.slice(0, 220))}</div>` : ''}</td>
<td>${esc(t.project)}</td><td class="dur">${fmtDur(t.duration)}</td></tr>`,
  )
  .join('')}
</tbody></table></div>

<footer>Generated by scripts/generate-dashboard.js · history keeps the last ${MAX_HISTORY} CI runs.</footer>
</div>
<script>
  const q=document.getElementById('q'),rows=[...document.querySelectorAll('#t tbody tr')];
  q.addEventListener('input',()=>{const v=q.value.toLowerCase().trim();rows.forEach(r=>r.style.display=!v||r.dataset.s.includes(v)?'':'none')});
</script>
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
fs.writeFileSync(path.join(outDir, 'history.json'), JSON.stringify(history, null, 2));
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(run, null, 2));
console.log(
  `Dashboard -> ${path.join(outDir, 'index.html')}  (${summary.passed} passed, ${summary.failed} failed, ${summary.flaky} flaky, ${summary.skipped} skipped, ${summary.passRate}% pass rate)`,
);
