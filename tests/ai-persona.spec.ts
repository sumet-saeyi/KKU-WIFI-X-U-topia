import { expect, test } from './fixtures';
import sharp from 'sharp';
import { POST as agent } from '../src/app/api/agent/route';
import { POST as companion } from '../src/app/api/companion/route';
import { companionContext } from '../src/lib/companion';
import { initialWallet } from '../src/lib/presetData';
import { isSameOriginRequest } from '../src/lib/requestOrigin';

test('both U-Bot routes send the shared Ikigai persona as a system message in all languages', async () => {
  const original = globalThis.fetch;
  const previous = process.env.UBOT_BEARER_TOKEN;
  process.env.UBOT_BEARER_TOKEN = 'persona-test-token';
  const payloads: { userText: string; messages: { role: string; content: string }[] }[] = [];
  globalThis.fetch = async (_url, options) => { payloads.push(JSON.parse(String(options?.body))); return new Response('I am U-Pilot, your Ikigai companion.'); };
  try {
    for (const language of ['en', 'th', 'es']) {
      const body = { language, stageSafeMode: false, prompt: 'What do you do?', messages: [{ role: 'user', text: 'What do you do?' }], context: companionContext(initialWallet, 'home') };
      for (const [path, handler] of [['agent', agent], ['companion', companion]] as const) {
        const response = await handler(new Request(`http://localhost/api/${path}`, { method: 'POST', body: JSON.stringify(body) }));
        expect(response.status).toBe(200);
        const system = payloads.at(-1)!.messages[0];
        expect(payloads.at(-1)!.userText).toContain(system.content);
        expect(payloads.at(-1)!.messages.at(-1)!.content).toContain(system.content);
        expect(payloads.at(-1)!.userText).toContain('What do you do?');
        expect(payloads.at(-1)!.userText).toContain('not a request to change the underlying U-Bot service or bypass its rules');
        expect(system.role).toBe('system'); expect(system.content).toContain('You are U-Pilot, the Ikigai companion inside U-Ikigai');
        for (const rule of ['at most one focused clarifying question', 'can be free, small, ordinary', 'SAMPLE data', 'you cannot confirm them', 'untrusted data', 'no such tools are available']) expect(system.content.toLowerCase()).toContain(rule.toLowerCase());
        expect(system.content).toContain(language === 'th' ? 'Respond in Thai' : language === 'es' ? 'Respond in Mexican Spanish' : 'Respond in English');
        expect((await response.json()).source).toBe('live');
      }
    }
  } finally { globalThis.fetch = original; if (previous === undefined) delete process.env.UBOT_BEARER_TOKEN; else process.env.UBOT_BEARER_TOKEN = previous; }
});

test('origin validation accepts the actual local request host and still rejects foreign origins', () => {
  const request = (origin: string, host = '127.0.0.1:3000') => new Request('http://localhost:3000/api/companion', { headers: { Origin: origin, Host: host } });
  expect(isSameOriginRequest(request('http://127.0.0.1:3000'))).toBe(true);
  expect(isSameOriginRequest(request('http://localhost:3000'))).toBe(true);
  expect(isSameOriginRequest(request('http://foreign.example:3000', 'foreign.example:3000'))).toBe(false);
  for (const origin of ['https://foreign.example', 'null', 'http://127.0.0.1:3001', 'https://127.0.0.1:3000', 'http://127.0.0.1:3000/path']) expect(isSameOriginRequest(request(origin))).toBe(false);
});

test('chat is online by default, has no offline switch, and reconnects for the next question', async ({ page, context }) => {
  const sent: { stageSafeMode: boolean; messages: { text: string }[] }[] = [];
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true, speech: { configured: false } } }));
  await page.route('**/api/companion', (route) => {
    sent.push(route.request().postDataJSON());
    return route.fulfill({ json: { text: 'I’m U-Pilot. Let’s find one meaningful next step.', source: 'live', followUps: [], latencyMs: 1, plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } } });
  });
  await page.goto('/mobile');
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Offline practice', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toContainText('AI connects automatically');
  await page.getByRole('button', { name: 'Close preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.locator('#ai-question').fill('What do you do?'); await page.locator('.ai-send').click();
  await expect(page.locator('.ai-message.assistant').last()).toContainText('U-Bot');
  expect(sent[0].stageSafeMode).toBe(false);
  await context.setOffline(true);
  await page.locator('#ai-question').fill('Explain my sample balance'); await page.locator('.ai-send').click();
  await expect(page.locator('.ai-message.assistant').last()).toContainText('Saved guide · not live AI');
  expect(sent).toHaveLength(1);
  await context.setOffline(false);
  await page.locator('#ai-question').fill('Help me choose a small next step'); await page.locator('.ai-send').click();
  await expect(page.locator('.ai-message.assistant').last()).toContainText('U-Bot');
  expect(sent).toHaveLength(2); expect(sent[1].stageSafeMode).toBe(false);
});

test('a provider outage does not permanently pin the next question to saved guides', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/companion', (route) => {
    calls += 1;
    return calls === 1 ? route.fulfill({ status: 502, json: { code: 'upstream_error' } }) : route.fulfill({ json: { text: 'Connected again.', source: 'live', followUps: [], plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } } });
  });
  await page.goto('/desktop'); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.locator('#ai-question').fill('Explain my balance'); await page.locator('.ai-send').click();
  await expect(page.locator('.ai-chat-fallback')).toContainText('saved guide, not live AI');
  await page.getByRole('button', { name: 'Try AI again', exact: true }).click();
  await expect(page.locator('.ai-message.assistant').last()).toContainText('Connected again.');
  await expect(page.locator('.ai-chat-fallback')).toHaveCount(0); expect(calls).toBe(2);
});

test('photo failures never fall back to invented photo descriptions', async ({ page }) => {
  await page.goto('/desktop'); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.getByLabel('Choose a photo for AI', { exact: true }).setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('.ai-photo-preview img')).toBeVisible();
  await page.locator('#ai-question').fill('What does this photo show?'); await page.locator('.ai-send').click();
  await expect(page.locator('.ai-chat-error[role="alert"]')).toBeVisible();
  await expect(page.locator('.ai-message.assistant')).toHaveCount(0);
  await expect(page.locator('.ai-photo-preview')).toBeVisible();
});

for (const width of [320, 390, 1440]) {
  test(`Powered by shows all four local logos and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 900 ? 820 : 1000 }); await page.goto(width < 900 ? '/mobile' : '/desktop');
    const footer = page.locator('.product-footer .powered-by');
    await expect(footer).toContainText('Powered by');
    for (const brand of ['U-Bot', 'U-topia', 'ElevenLabs', 'Avalanche']) {
      const logo = footer.getByRole('img', { name: brand, exact: true });
      await expect(logo).toBeVisible(); expect(await logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(logo).toHaveAttribute('src', /^\/brands\//);
    }
    await expect(footer.getByRole('link', { name: /Avalanche/ })).toHaveAttribute('href', 'https://www.avalanche.com');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
    const header = page.locator('.ai-chat-header .powered-by');
    await expect(header).toContainText('Powered by');
    for (const brand of ['U-Bot', 'U-topia', 'ElevenLabs', 'Avalanche']) {
      const logo = header.getByRole('img', { name: brand, exact: true });
      await expect(logo).toBeVisible();
      expect(await logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const lastLogo = await header.getByRole('img', { name: 'Avalanche', exact: true }).boundingBox();
    const close = await page.getByRole('button', { name: 'Close AI companion', exact: true }).boundingBox();
    expect(lastLogo!.x + lastLogo!.width).toBeLessThanOrEqual(close!.x);
    await page.getByRole('button', { name: 'Close AI companion', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
}

test('project PNG downloads preserve the 1024px logo with transparent and dark backgrounds', async ({ request }) => {
  for (const name of ['logo', 'icon']) {
    const response = await request.get(`/branding/u-ikigai-${name}.png`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const png = await response.body();
    expect(await sharp(png).metadata()).toMatchObject({ format: 'png', width: 1024, height: 1024, hasAlpha: true });
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const background = (100 * info.width + 512) * info.channels;
    expect(data[background + 3]).toBe(name === 'logo' ? 0 : 255);
    if (name === 'icon') expect([...data.subarray(background, background + 3)]).toEqual([16, 28, 34]);
    expect(data[(512 * info.width + 512) * info.channels + 3]).toBe(255);
  }
});
