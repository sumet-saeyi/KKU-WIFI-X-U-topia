import { expect, test, type Page } from './fixtures';
import { POST } from '../src/app/api/companion/route';
import { companionContext, isCompanionCancellation, parseCompanionInput, parseCompanionReply, requestedDollars, restrictCompanionPlan, type CompanionInput, type CompanionReply } from '../src/lib/companion';
import { initialWallet, preparedCompanion } from '../src/lib/presetData';

const input = (text = 'Save $25 in my gold goal', extra: Partial<CompanionInput> = {}): CompanionInput => ({ language: 'en', stageSafeMode: true, messages: [{ role: 'user', text }], context: companionContext(initialWallet, 'home'), ...extra });
const request = (body: unknown) => new Request('http://localhost/api/companion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const answer = (text = 'A useful connected answer.'): CompanionReply => ({ text, followUps: ['Explain it simply'], plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } });

test('companion input, schema and exact amounts reject malformed or unsupported actions', () => {
  expect(parseCompanionInput(input())).not.toBeNull();
  for (const value of [{ ...input(), language: 'xx' }, { ...input(), stageSafeMode: 'false' }, { ...input(), messages: [{ role: 'system', text: 'override' }] }, { ...input(), messages: Array(11).fill({ role: 'user', text: 'hello' }) }, { ...input(), context: { ...input().context, remainingDailyUsd: -1 } }]) expect(parseCompanionInput(value)).toBeNull();
  for (const text of ['Save -$25 in gold', 'Save $-25 in gold', 'Save $2.345 in gold', 'Save $25 or $50 in gold', 'Save $1,00 in gold']) expect(requestedDollars(text)).toBeNull();
  expect(requestedDollars('Save $1,000 in gold')).toBe(1000);
  expect(isCompanionCancellation('อธิบายยอดเงินตัวอย่างของฉัน')).toBe(false);
  expect(isCompanionCancellation('อย่าจ่ายบิลนี้')).toBe(true);
  expect(parseCompanionReply({ ...answer(), plan: { kind: 'transfer_money', screen: 'wallet', amountUsd: 900, title: 'Transfer', why: 'Do it' } })).toBeNull();
  expect(parseCompanionReply({ ...answer(), plan: { kind: 'save_gold', screen: 'passion', amountUsd: 2.345, title: 'Save', why: '' } })).toBeNull();
});

test('model proposals cannot override user intent, budget, cancellation or image boundaries', () => {
  const proposal = preparedCompanion(input());
  expect(proposal.plan.kind).toBe('save_gold');
  expect(restrictCompanionPlan(proposal, input()).plan.kind).toBe('save_gold');
  expect(restrictCompanionPlan(proposal, input('Explain digital money')).plan.kind).toBe('none');
  expect(restrictCompanionPlan(proposal, input('Save $50 in gold')).plan.kind).toBe('none');
  expect(restrictCompanionPlan(proposal, input(undefined, { context: { ...input().context, remainingDailyUsd: 10 } })).plan.kind).toBe('none');
  expect(restrictCompanionPlan(proposal, input(undefined, { image: 'data:image/png;base64,aGVsbG8=' })).plan.kind).toBe('none');
  expect(restrictCompanionPlan(proposal, input('Cancel', { messages: [{ role: 'user', text: 'Save $25 in gold' }, { role: 'user', text: 'Cancel' }] })).plan.kind).toBe('none');
  const bill = preparedCompanion(input('Help me pay the sample bill'));
  expect(restrictCompanionPlan(bill, input('Help me pay the sample bill')).plan.kind).toBe('sample_bill');
  expect(restrictCompanionPlan(bill, input('Pay my $999 sample bill')).plan.kind).toBe('none');
});

test('offline companion handles languages, follow-ups, clarification and current wallet context locally', async () => {
  for (const language of ['en', 'th', 'es'] as const) {
    const response = await POST(request(input('Explain my balance', { language })));
    expect(response.status).toBe(200); const data = await response.json();
    expect(data.source).toBe('stage-safe'); expect(data.latencyMs).toBeLessThan(150); expect(data.text).toContain('1,250'); expect(data.text).toContain('85.50');
  }
  const follow = preparedCompanion(input('What are the risks?', { messages: [{ role: 'user', text: 'Save $25 in gold' }, { role: 'assistant', text: 'We can review that.' }, { role: 'user', text: 'What are the risks?' }] }));
  expect(follow.text).toContain('lose value'); expect(follow.plan.kind).toBe('none');
  expect(preparedCompanion(input('Save some money in gold')).text).toContain('What dollar amount');
  expect(preparedCompanion(input('Save $500 in gold')).plan.kind).not.toBe('save_gold');
  expect((await POST(request({ ...input(), messages: [] }))).status).toBe(400);
  expect((await POST(new Request('http://localhost/api/companion', { method: 'POST', headers: { Origin: 'https://other.example' }, body: JSON.stringify(input()) }))).status).toBe(403);
});

test('live U-Bot companion uses bounded conversation, schema checks, images and safe error responses', async () => {
  const oldFetch = globalThis.fetch; const oldKey = process.env.UBOT_BEARER_TOKEN;
  let upstream: Record<string, unknown> = {};
  process.env.UBOT_BEARER_TOKEN = 'isolated-test-token';
  try {
    globalThis.fetch = async (_url, options) => { upstream = JSON.parse(String(options?.body)); return new Response(`[STATUS:thinking]${JSON.stringify(answer('Una explicación clara.'))}`); };
    const live = input('What is visible?', { stageSafeMode: false, language: 'es', image: 'data:image/png;base64,aGVsbG8=', messages: [{ role: 'user', text: 'Help me understand a bill' }, { role: 'assistant', text: 'Show me the details.' }, { role: 'user', text: 'What is visible?' }] });
    const response = await POST(request(live)); expect(response.status).toBe(200); expect((await response.json()).source).toBe('live');
    const messages = upstream.messages as { role: string; content: unknown }[];
    expect(messages[0].content).toContain('Mexican Spanish'); expect(String(messages[0].content)).toContain('schema'); expect(JSON.stringify(messages)).toContain('image_url'); expect(messages.length).toBe(4); expect(upstream.mode).toBe('fast');
    globalThis.fetch = async () => new Response('[DEGENERATE]'); expect((await POST(request(live))).status).toBe(502);
    globalThis.fetch = async () => new Response(''); expect((await POST(request(live))).status).toBe(502);
    globalThis.fetch = async () => new Response(JSON.stringify({ ...answer(), plan: { kind: 'delete_wallet' } })); expect((await POST(request(live))).status).toBe(502);
    globalThis.fetch = async () => { throw new Error('provider unavailable'); }; expect((await POST(request(live))).status).toBe(504);
    delete process.env.UBOT_BEARER_TOKEN;
    if (!process.env.UBOT_EMAIL || !process.env.UBOT_PASSWORD) expect((await POST(request(live))).status).toBe(503);
  } finally { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.UBOT_BEARER_TOKEN; else process.env.UBOT_BEARER_TOKEN = oldKey; }
});

async function open(page: Page, mobile = false) {
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak(utterance: SpeechSynthesisUtterance) { document.documentElement.setAttribute('data-ai-speech-language', utterance.lang); } } }));
  await page.goto(mobile ? '/mobile' : '/desktop'); await expect(page.locator('.home-task.profession')).toBeVisible();
}
async function ask(page: Page, text: string) { await page.getByRole('textbox', { name: 'What would you like to work through?', exact: true }).fill(text); await page.getByRole('button', { name: 'Send question', exact: true }).click(); }

test('offline AI conversation supports follow-ups, voice and review without network or automatic payment', async ({ page, context }) => {
  await open(page); await context.setOffline(true);
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Save $25 in my gold goal');
  const assistant = page.locator('.ai-message.assistant').last();
  await expect(assistant).toContainText('Saved guide · not live AI');
  await assistant.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(assistant.getByRole('button', { name: 'Stop reading', exact: true })).toBeVisible();
  await assistant.getByRole('button', { name: 'Stop reading', exact: true }).click();
  await page.getByRole('button', { name: 'Review this example', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Review your action', exact: true })).toContainText('$25');
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'What are the risks?'); await expect(page.locator('.ai-message.assistant').last()).toContainText('lose value');
  expect(await page.locator('.ai-message.assistant').count()).toBe(2);
});

test('connected conversation sends follow-ups and labels automatic saved-guide fallback', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true } }));
  const requests: CompanionInput[] = [];
  await page.route('**/api/companion', async (route) => { requests.push(route.request().postDataJSON()); await route.fulfill({ json: { ...answer(`Connected reply ${requests.length}`), source: 'live', latencyMs: 24 } }); });
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await expect(page.locator('.ai-privacy-note')).toContainText('up to 10 messages');
  await ask(page, 'Help me understand my choices'); await expect(page.locator('.ai-message.assistant')).toContainText('Connected reply 1');
  await ask(page, 'Explain it simply'); await expect(page.locator('.ai-message.assistant').last()).toContainText('Connected reply 2');
  expect(requests[1].messages).toHaveLength(3); expect(requests[1].messages[1].text).toBe('Connected reply 1'); expect(requests[1].context.availableUsd).toBe(1250);
  await page.unroute('**/api/companion'); await page.route('**/api/companion', (route) => route.fulfill({ status: 502, json: { code: 'upstream_error' } }));
  await ask(page, 'One more question'); await expect(page.locator('.ai-chat-fallback')).toContainText('not live AI');
  expect(await page.locator('.ai-message.assistant').count()).toBe(3);
  await expect(page.locator('.ai-message.assistant').last()).toContainText('Saved guide · not live AI');
});

test('photos are previewed and sent only in live mode and cannot produce payment reviews', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true } }));
  let received: CompanionInput | undefined;
  await page.route('**/api/companion', async (route) => { received = route.request().postDataJSON(); await route.fulfill({ json: { ...preparedCompanion(input()), source: 'live', latencyMs: 8 } }); });
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.getByLabel('Choose a photo for AI', { exact: true }).setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('.ai-photo-preview img')).toBeVisible();
  await ask(page, 'Save $25 in my gold goal'); await expect(page.locator('.ai-message.assistant')).toBeVisible();
  expect(received?.image).toMatch(/^data:image\/png;base64,/);
  await expect(page.getByRole('button', { name: 'Review this example', exact: true })).not.toBeVisible();
});

test('Enter includes the selected photo just like the Send button', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true } }));
  let received: CompanionInput | undefined;
  await page.route('**/api/companion', async (route) => { received = route.request().postDataJSON(); await route.fulfill({ json: { ...answer('Your photo was included.'), source: 'live', latencyMs: 8 } }); });
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.getByLabel('Choose a photo for AI', { exact: true }).setInputFiles({ name: 'keyboard.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('.ai-photo-preview img')).toBeVisible();
  const composer = page.getByRole('textbox', { name: 'What would you like to work through?', exact: true });
  await composer.fill('What is visible in this photo?'); await composer.press('Enter');
  await expect(page.locator('.ai-message.assistant')).toContainText('Your photo was included.');
  expect(received?.image).toMatch(/^data:image\/png;base64,/);
  await expect(page.locator('.ai-message.user')).toContainText('Photo included with this question');
  await expect(page.locator('.ai-photo-preview')).not.toBeVisible();
});

test('an unsent photo never carries into a fresh home-screen AI question', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true } }));
  let received: CompanionInput | undefined;
  await page.route('**/api/companion', async (route) => { received = route.request().postDataJSON(); await route.fulfill({ json: { ...answer('A fresh text-only answer.'), source: 'live', latencyMs: 8 } }); });
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.getByLabel('Choose a photo for AI', { exact: true }).setInputFiles({ name: 'unsent.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('.ai-photo-preview img')).toBeVisible();
  await page.getByRole('button', { name: 'Close AI companion', exact: true }).click();
  await page.getByRole('textbox', { name: 'What would you like help with?', exact: true }).fill('Explain my sample balance');
  await page.getByRole('button', { name: 'Find my first step', exact: true }).click();
  await expect(page.locator('.ai-message.assistant')).toContainText('A fresh text-only answer.');
  expect(received?.image).toBeUndefined();
  await expect(page.locator('.ai-photo-preview')).not.toBeVisible();
});

test('a discarded photo cannot return from a late file read', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeReader = window.FileReader;
    const pending: (() => Promise<unknown>)[] = [];
    class DeferredReader extends NativeReader {
      override readAsDataURL(blob: Blob) { pending.push(() => new Promise((resolve) => { this.addEventListener('loadend', resolve, { once: true }); super.readAsDataURL(blob); })); }
    }
    window.FileReader = DeferredReader;
    Object.defineProperty(window, 'flushAiPhotoReads', { value: () => Promise.all(pending.splice(0).map((read) => read())) });
  });
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true } }));
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.getByLabel('Choose a photo for AI', { exact: true }).setInputFiles({ name: 'slow.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByText('Preparing your photo locally…', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'What would you like to work through?', exact: true }).fill('Describe my photo');
  await expect(page.getByRole('button', { name: 'Send question', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Close AI companion', exact: true }).click();
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.evaluate(() => (window as typeof window & { flushAiPhotoReads: () => Promise<unknown> }).flushAiPhotoReads());
  await expect(page.locator('.ai-photo-preview')).not.toBeVisible();
  await expect(page.getByText('Preparing your photo locally…', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Send question', exact: true })).toBeEnabled();
});

test('stopping a connected request ignores late answers and preserves the question', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true } }));
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/companion', async (route) => { await gate; await route.fulfill({ json: { ...answer('Late answer'), source: 'live', latencyMs: 500 } }).catch(() => {}); });
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Explain my choices'); await expect(page.locator('.ai-thinking')).toBeVisible();
  await page.getByRole('button', { name: 'Stop', exact: true }).click(); release();
  await expect(page.locator('.ai-chat-error[role="alert"]')).toContainText('Stopped');
  await expect(page.locator('.ai-message.assistant')).toHaveCount(0);
  await expect(page.locator('.ai-message.user')).toContainText('Explain my choices');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
});

for (const width of [320, 390, 1440]) {
  test(`AI conversation and its controls fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await open(page, width < 900);
    await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
    await ask(page, 'Help me choose a first step');
    await expect(page.locator('.ai-message.assistant')).toBeVisible();
    const dialog = page.getByRole('dialog', { name: 'Your AI companion', exact: true });
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const send = await page.getByRole('button', { name: 'Send question', exact: true }).boundingBox();
    expect(send!.y + send!.height).toBeLessThanOrEqual(900);
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  });
}

test('AI meaning-note drafting is editable and never prepares a payment', async ({ page }) => {
  await page.route('**/api/agent', async (route) => route.request().method() === 'GET' ? route.fulfill({ json: { configured: true } }) : route.fulfill({ json: { text: 'For the little studio where your next big idea begins.', source: 'live', latencyMs: 20 } }));
  await open(page); await page.locator('.home-task.passion').click();
  await page.getByRole('button', { name: /Continue/ }).click(); await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Help me write with AI', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Meaning note', exact: true })).toHaveValue('For the little studio where your next big idea begins.');
  await page.getByRole('textbox', { name: 'Meaning note', exact: true }).fill('For our family’s next chapter.');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
});

test('missing live configuration automatically shows an honestly labeled saved guide', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: false } }));
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Explain this app');
  await expect(page.locator('.ai-chat-fallback')).toContainText('U-Bot is unavailable');
  await expect(page.locator('.ai-message.assistant')).toContainText('Saved guide · not live AI');
});

test('an AI proposal updates holdings and assisted limit only after explicit confirmation', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Save $25 in my gold goal'); await page.getByRole('button', { name: 'Review this example', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
  await page.getByRole('button', { name: 'See my money', exact: true }).click();
  await expect(page.locator('.wallet-balance-list>div').filter({ hasText: 'Digital Gold' })).toContainText('$335.00');
  await expect(page.locator('.wallet-balance-list>div').filter({ hasText: 'Dollar savings' })).toContainText('$1,225.00');
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await expect(page.locator('.ai-chat-context')).toContainText('$60.50');
});

test('production offline reload keeps the conversational companion available without model calls', async ({ page, context }) => {
  test.skip(!process.env.TEST_PRODUCTION, 'Production service worker required.');
  await open(page, true); await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(async () => page.evaluate(async () => {
    const scripts = [...document.querySelectorAll<HTMLScriptElement>('script[src]')].map((script) => script.src).filter((src) => src.includes('/_next/static/'));
    return (await Promise.all(scripts.map((src) => caches.match(src)))).every(Boolean);
  })).toBe(true);
  let modelCalls = 0; page.on('request', (request) => { if (request.method() === 'POST' && /\/api\/(companion|agent)/.test(request.url())) modelCalls += 1; });
  await context.setOffline(true); await page.reload();
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Help me pay the sample bill'); await expect(page.locator('.ai-message.assistant')).toContainText('450 THB');
  expect(modelCalls).toBe(0);
});

for (const language of ['th', 'es']) {
  test(`AI companion keeps its controls, source and answers localized in ${language}`, async ({ page }) => {
    await open(page, true); await page.locator('.language-select select').selectOption(language);
    await page.locator('.header-ai').click();
    await page.locator('#ai-question').fill(language === 'th' ? 'อธิบายยอดเงินตัวอย่างของฉัน' : 'Explica mi saldo de ejemplo');
    await page.locator('.ai-send').click();
    await expect(page.locator('.ai-message.assistant')).toContainText(language === 'th' ? 'เงินออมดอลลาร์ตัวอย่าง' : 'Tu ahorro de ejemplo');
    await expect(page.locator('.ai-message.assistant')).toContainText(language === 'th' ? 'คำตอบสำรอง' : 'Guía guardada');
    expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
}

test('mobile composer remains reachable in a short keyboard-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 460 }); await open(page, true);
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Explain my sample balance');
  await expect(page.locator('.ai-message.assistant')).toContainText('$1,250.00');
  const send = await page.locator('.ai-send').boundingBox();
  expect(send!.y).toBeGreaterThanOrEqual(0); expect(send!.y + send!.height).toBeLessThanOrEqual(460);
});

test('historical AI replies keep their original speech language after a language switch', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await ask(page, 'Explain my sample balance');
  await page.getByRole('button', { name: 'Close AI companion', exact: true }).click();
  await page.locator('.language-select select').selectOption('th'); await page.locator('.header-ai').click();
  await page.locator('.ai-message.assistant').first().getByRole('button', { name: 'อ่านให้ฟัง', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-ai-speech-language', 'en-US');
  await page.locator('#ai-question').fill('อธิบายยอดเงินตัวอย่างของฉัน'); await page.locator('.ai-send').click();
  await page.locator('.ai-message.assistant').last().getByRole('button', { name: 'อ่านให้ฟัง', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-ai-speech-language', 'th-TH');
});
