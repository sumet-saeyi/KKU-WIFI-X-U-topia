import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const directory = new URL('../docs/images/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    // Screenshots never contact or consume a real provider account.
    await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: false, provider: 'ubot', speech: { configured: false, provider: 'elevenlabs' } } }));
    await page.route('**/api/companion', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
    await page.route('**/api/tts', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
    await page.goto(`${baseUrl}/${name}`);
    await page.locator('.home-task.profession').waitFor();
    await page.locator('.home-ai-source').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const path = fileURLToPath(new URL(`u-ikigai-${name}.png`, directory));
    await page.screenshot({ path, fullPage: name === 'desktop', animations: 'disabled' });
    console.log(`Saved ${path}`);
    await page.close();
  }
} finally {
  await browser.close();
}
