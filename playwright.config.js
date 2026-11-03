// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

const isCI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL || 'https://qademo.com';

module.exports = defineConfig({
  testDir: './tests',
  outputDir: 'reports/test-artifacts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 3 : undefined,

  // Locally: list + HTML + JSON + JUnit + Allure.
  // CI: each shard writes a blob report that the "report" job merges into one HTML/JSON/JUnit set.
  reporter: [
    ['list'],
    ...(isCI
      ? [['blob']]
      : [
          ['html', { outputFolder: 'reports/html', open: 'never' }],
          ['json', { outputFile: 'reports/results.json' }],
          ['junit', { outputFile: 'reports/junit.xml' }],
        ]),
    [
      'allure-playwright',
      {
        resultsDir: 'reports/allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          BaseURL: BASE_URL,
          Node: process.version,
          OS: process.platform,
        },
      },
    ],
  ],

  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      testIgnore: /mobile\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/e2e',
      testIgnore: /mobile\.spec\.js/,
      grep: /@smoke/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      testDir: './tests/e2e',
      testMatch: /mobile\.spec\.js/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
