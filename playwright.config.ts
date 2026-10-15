import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3001', headless: true, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  webServer: process.env.TEST_BASE_URL ? undefined : { command: 'npm run dev -- --hostname 127.0.0.1 --port 3001', url: 'http://127.0.0.1:3001', reuseExistingServer: true },
});
