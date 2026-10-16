import { test as base } from '@playwright/test';

/** Ordinary browser journeys never spend a configured real provider account. Override a route to test live transport. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/agent', (route) => route.request().method() === 'GET'
      ? route.fulfill({ json: { configured: false, provider: 'ubot', speech: { configured: false, provider: 'elevenlabs' } } })
      : route.fulfill({ status: 503, json: { code: 'not_configured' } }));
    await page.route('**/api/companion', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
    await page.route('**/api/tts', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
    await use(page);
  },
});

export { expect, type Page } from '@playwright/test';
