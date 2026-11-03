const js = require('@eslint/js');
const globals = require('globals');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  { ignores: ['node_modules/', 'reports/', 'site/', 'blob-report/', 'playwright-report/', 'test-results/', 'all-blob-reports/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['tests/**/*.js'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'off',
    },
  },
];
