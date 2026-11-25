const { defineConfig } = require('@playwright/test');
const path = require('node:path');

try { process.loadEnvFile(path.join(__dirname, '.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const variable of ['SUPABASE_URL', 'SUPABASE_KEY', 'TEST_EMAIL', 'TEST_PASSWORD']) {
  if (!process.env[variable]) throw new Error(`Falta ${variable} en .env o en el entorno de pruebas.`);
}
require('./server').configuracionPublica(process.env);

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 45000,
  expect: { timeout: 12000 },
  outputDir: 'test-results',
  reporter: [['./tests/reportero-seguro.cjs']],
  use: {
    baseURL: 'http://localhost:3005',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    viewport: { width: 1280, height: 800 },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3005/health',
    env: { PORT: '3005' },
    reuseExistingServer: false,
    timeout: 15000,
  },
});
