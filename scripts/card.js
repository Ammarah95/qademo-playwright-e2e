/**
 * Renders site/card.svg – a live "latest CI run" card that the GitHub profile README embeds.
 * Regenerated on every pipeline run, so the profile always shows real, current results.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * @param {{summary: object, run: object, byProject: Record<string,{passed:number,failed:number,flaky:number,skipped:number}>, history: object[]}} data
 */
function renderCard({ summary, run, byProject, history }) {
  const W = 1200;
  const H = 300;
  const ok = summary.failed === 0;
  const accent = ok ? '#45D69A' : '#F0606B';
  const date = new Date(summary.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  // per-project bars
  const projects = Object.entries(byProject);
  const barX = 510;
  const barW = 320;
  const rows = projects
    .map(([name, g], i) => {
      const total = g.passed + g.failed + g.flaky + g.skipped || 1;
      const y = 92 + i * 44;
      const pw = (g.passed / total) * barW;
      const fw = (g.flaky / total) * barW;
      const xw = (g.failed / total) * barW;
      return `
    <text x="${barX}" y="${y}" class="mono label">${esc(name)}</text>
    <text x="${barX + barW}" y="${y}" class="mono label" text-anchor="end">${g.passed}/${total}</text>
    <rect x="${barX}" y="${y + 10}" width="${barW}" height="6" rx="3" fill="#E6F0F1" fill-opacity=".08"/>
    <rect x="${barX}" y="${y + 10}" width="${pw.toFixed(1)}" height="6" rx="3" fill="#45D69A"/>
    ${fw ? `<rect x="${(barX + pw).toFixed(1)}" y="${y + 10}" width="${fw.toFixed(1)}" height="6" fill="#F3B23C"/>` : ''}
    ${xw ? `<rect x="${(barX + pw + fw).toFixed(1)}" y="${y + 10}" width="${xw.toFixed(1)}" height="6" fill="#F0606B"/>` : ''}`;
    })
    .join('');

  // pass-rate trend (last 20 runs)
  const pts = history.slice(-20);
  const sx = 890;
  const sw = 262;
  const sy = 92;
  const sh = 120;
  const coords = pts.map((h, i) => {
    const x = pts.length === 1 ? sx + sw / 2 : sx + (i * sw) / (pts.length - 1);
    const y = sy + sh - ((h.passRate || 0) / 100) * sh;
    return [x, y, h];
  });
  const poly = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const dots = coords
    .map(([x, y, h]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${h.failed ? '#F0606B' : '#45D69A'}"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">Latest CI run of qademo-playwright-e2e: ${summary.passRate}% pass rate, ${summary.total} tests, ${summary.failed} failed</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0E2A30"/><stop offset="1" stop-color="#123840"/></linearGradient>
    <clipPath id="c"><rect width="${W}" height="${H}" rx="22"/></clipPath>
    <style>
      .sans { font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
      .mono { font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace; }
      .label { font-size: 16px; fill: #BFD6DA; }
      .muted { font-size: 16px; fill: #86A7AE; }
    </style>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="8" height="${H}" fill="${accent}"/>
  </g>

  <text x="56" y="70" class="mono muted">qademo-playwright-e2e, run #${esc(run.id)}, ${esc(date)}</text>
  <text x="52" y="172" class="sans" font-size="104" font-weight="800" fill="${accent}" letter-spacing="-3">${summary.passRate}%</text>
  <text x="58" y="208" class="sans" font-size="22" fill="#E6F0F1">of ${summary.total} tests passed on the latest run</text>
  <text x="58" y="252" class="mono" font-size="16"><tspan fill="${summary.failed ? '#F0606B' : '#86A7AE'}">${summary.failed} failed</tspan><tspan fill="#86A7AE">, ${summary.flaky} flaky, </tspan><tspan fill="#F3B23C">${summary.knownDefects} known defects tracked</tspan></text>

  <text x="${barX}" y="60" class="sans" font-size="17" font-weight="600" fill="#E6F0F1">By browser</text>
  ${rows}

  <text x="${sx}" y="60" class="sans" font-size="17" font-weight="600" fill="#E6F0F1">Pass rate, last ${pts.length} run${pts.length === 1 ? '' : 's'}</text>
  <line x1="${sx}" x2="${sx + sw}" y1="${sy}" y2="${sy}" stroke="#E6F0F1" stroke-opacity=".08"/>
  <line x1="${sx}" x2="${sx + sw}" y1="${sy + sh}" y2="${sy + sh}" stroke="#E6F0F1" stroke-opacity=".08"/>
  <text x="${sx + sw}" y="${sy - 8}" class="mono" font-size="13" fill="#5F8790" text-anchor="end">100%</text>
  <text x="${sx + sw}" y="${sy + sh + 20}" class="mono" font-size="13" fill="#5F8790" text-anchor="end">0%</text>
  ${pts.length > 1 ? `<polyline points="${poly}" fill="none" stroke="#45D69A" stroke-width="2.5" stroke-linejoin="round"/>` : ''}
  ${dots}
  <text x="${sx}" y="${sy + sh + 52}" class="mono muted" font-size="14">Ran in ${Math.round(summary.durationMs / 1000)}s</text>
</svg>`;
}

module.exports = { renderCard };
