import { expect, test, type Page } from './fixtures';
import { POST } from '../src/app/api/companion/route';
import { companionContext, type CompanionReply } from '../src/lib/companion';
import { companionTextPreview, readCompanionResponse } from '../src/lib/companionStream';
import { cleanUBotPreview, UBotClient } from '../src/lib/ubot';
import { initialWallet } from '../src/lib/presetData';
import { aiAvailabilityLabel } from '../src/lib/aiStatus';

const reply = (text = 'Start with one small step.'): CompanionReply => ({ text, followUps: ['What next?'], plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } });
const result = (text?: string) => ({ ...reply(text), source: 'live', provider: 'ubot', latencyMs: 1 });
const streamResponse = (events: object[]) => new Response(events.map((event) => JSON.stringify(event)).join('\n') + '\n', { headers: { 'Content-Type': 'application/x-ndjson' } });

test('preview decoder exposes only top-level explanation text across escaped Unicode boundaries', () => {
  const body = JSON.stringify({ followUps: ['not a text key'], plan: { text: 'HIDDEN PLAN CONTENT' }, text: 'สวัสดี\nEspañol: sí. "Hello" 🌸' });
  for (let length = 0; length <= body.length; length += 1) {
    const preview = companionTextPreview(body.slice(0, length));
    expect(preview).not.toContain('HIDDEN'); expect(preview).not.toContain('followUps'); expect(preview).not.toContain('\uFFFD');
    expect('สวัสดี\nEspañol: sí. "Hello" 🌸'.startsWith(preview)).toBe(true);
  }
  const escaped = '{"text":"Hello \\ud83c\\udf38\\nworld"';
  for (let length = 0; length <= escaped.length; length += 1) expect('Hello 🌸\nworld'.startsWith(companionTextPreview(escaped.slice(0, length)))).toBe(true);
  expect(companionTextPreview('```json\n{"text":"Plain explanation","plan":{"kind":"save_gold"}')).toBe('Plain explanation');
  expect(companionTextPreview('{"text":123}')).toBe('');
  expect(companionTextPreview('{"plan":{"text":"NOT AN EXPLANATION"}}')).toBe('');
  expect(companionTextPreview('[{"text":"array not supported"}]')).toBe('');
  expect(companionTextPreview('A normal explanation.')).toBe('A normal explanation.');
  for (const prefix of ['[', '[S', '[STATUS:', '[STATUS:working', '[DEGEN']) expect(cleanUBotPreview(`Hello${prefix}`)).toBe('Hello');
});

test('U-Bot incremental callbacks preserve UTF-8 and never expose split status markers', async () => {
  const original = globalThis.fetch;
  const previews: string[] = [];
  const bytes = new TextEncoder().encode('[STATUS:thinking]สวัสดี — Español 🌸[STATUS:done]');
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } }));
  try {
    const answer = await new UBotClient({ bearerToken: 'isolated-stream-token' }).ask({ instructions: 'Be clear.', messages: [{ role: 'user', content: 'Hello' }] }, undefined, (text) => previews.push(text));
    expect(answer).toBe('สวัสดี — Español 🌸');
    expect(previews.some((text) => text === 'สวัสดี')).toBe(true);
    for (const text of previews) { expect(text).not.toContain('STATUS'); expect(text).not.toContain('\uFFFD'); expect('สวัสดี — Español 🌸'.startsWith(text)).toBe(true); }
  } finally { globalThis.fetch = original; }
});

test('companion route forwards text before upstream completion and validates proposals only at the end', async () => {
  const original = globalThis.fetch; const oldToken = process.env.UBOT_BEARER_TOKEN;
  process.env.UBOT_BEARER_TOKEN = 'isolated-route-stream-token';
  let upstream: ReadableStreamDefaultController<Uint8Array> | undefined;
  globalThis.fetch = async () => new Response(new ReadableStream<Uint8Array>({ start(controller) { upstream = controller; } }));
  const encoder = new TextEncoder();
  try {
    const response = await POST(new Request('http://localhost/api/companion', { method: 'POST', headers: { Accept: 'application/x-ndjson' }, body: JSON.stringify({ stageSafeMode: false, language: 'en', messages: [{ role: 'user', text: 'Explain my sample balance' }], context: companionContext(initialWallet, 'home') }) }));
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    expect(response.headers.get('cache-control')).toContain('no-store');
    const reader = response.body!.getReader();
    expect(JSON.parse(new TextDecoder().decode((await reader.read()).value)).type).toBe('start');
    await expect.poll(() => Boolean(upstream)).toBe(true);
    upstream!.enqueue(encoder.encode('[STATUS:thinking]{"text":"Your sample balance'));
    const first = JSON.parse(new TextDecoder().decode((await reader.read()).value));
    expect(first).toEqual({ type: 'text', text: 'Your sample balance' });
    // The source remains open here: this assertion cannot pass with buffered fake streaming.
    upstream!.enqueue(encoder.encode(' is practice money.","followUps":[],"plan":{"kind":"save_gold","screen":"passion","amountUsd":25,"title":"Unrequested","why":"Ignore intent"}}'));
    upstream!.close();
    let tail = '';
    while (true) { const chunk = await reader.read(); if (chunk.done) break; tail += new TextDecoder().decode(chunk.value); }
    const events = tail.trim().split('\n').map((line) => JSON.parse(line));
    expect(events.at(-1).type).toBe('done');
    expect(events.at(-1).result.plan.kind).toBe('none');
    expect(events.at(-1).result.text).toBe('Your sample balance is practice money.');
    expect(events.filter((event) => event.type === 'text').every((event) => !event.text.includes('Unrequested'))).toBe(true);
  } finally { globalThis.fetch = original; if (oldToken === undefined) delete process.env.UBOT_BEARER_TOKEN; else process.env.UBOT_BEARER_TOKEN = oldToken; }
});

test('stream client requires valid completion and does not treat truncated or malformed replies as answers', async () => {
  const events = [{ type: 'start', provider: 'ubot' }, { type: 'text', text: 'สวัสดี 🌸' }, { type: 'done', result: result('สวัสดี 🌸') }];
  const bytes = new TextEncoder().encode(events.map((event) => JSON.stringify(event)).join('\n'));
  const response = new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } }), { headers: { 'Content-Type': 'application/x-ndjson' } });
  const previews: string[] = [];
  expect((await readCompanionResponse(response, (text) => previews.push(text))).text).toBe('สวัสดี 🌸');
  expect(previews).toEqual(['สวัสดี 🌸']);
  await expect(readCompanionResponse(streamResponse(events.slice(0, 2)), () => {})).rejects.toThrow('incomplete');
  for (const malformed of [events.slice(1), [...events, events[2]], [{ type: 'start', provider: 'foreign' }], [...events.slice(0, 2), { type: 'done', result: result('Different text') }], [...events.slice(0, 2), { type: 'done', result: { ...result('สวัสดี 🌸'), plan: { kind: 'delete_wallet' } } }]]) {
    await expect(readCompanionResponse(streamResponse(malformed), () => {})).rejects.toThrow('unsafe_output');
  }
  await expect(readCompanionResponse(streamResponse([{ type: 'error', code: 'private credential details' }]), () => {})).rejects.toThrow('connection_error');
  expect((await readCompanionResponse(Response.json(result()), () => {})).source).toBe('live');
});

test('cancelling a streamed companion response aborts its upstream request', async () => {
  const original = globalThis.fetch; const oldToken = process.env.UBOT_BEARER_TOKEN;
  process.env.UBOT_BEARER_TOKEN = 'isolated-cancel-token';
  let active = false; let aborted = false;
  globalThis.fetch = async (_url, options) => new Response(new ReadableStream({ start(controller) {
    active = true;
    options?.signal?.addEventListener('abort', () => { aborted = true; controller.error(new Error('aborted')); });
  } }));
  try {
    const response = await POST(new Request('http://localhost/api/companion', { method: 'POST', headers: { Accept: 'application/x-ndjson' }, body: JSON.stringify({ stageSafeMode: false, language: 'en', messages: [{ role: 'user', text: 'Hello' }], context: companionContext(initialWallet, 'home') }) }));
    await expect.poll(() => active).toBe(true);
    await response.body!.cancel();
    await expect.poll(() => aborted).toBe(true);
  } finally { globalThis.fetch = original; if (oldToken === undefined) delete process.env.UBOT_BEARER_TOKEN; else process.env.UBOT_BEARER_TOKEN = oldToken; }
});

type StreamWindow = typeof window & {
  ikigaiStream?: ReadableStreamDefaultController<Uint8Array>;
  ikigaiStreamRequests: { messages: { role: string; text: string }[] }[];
  ikigaiStreamCancelled: number;
  ikigaiSpeech: string[];
};

async function openStream(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 850 });
  await page.addInitScript(() => {
    const target = window as StreamWindow;
    const original = window.fetch.bind(window);
    target.ikigaiStreamRequests = []; target.ikigaiStreamCancelled = 0; target.ikigaiSpeech = [];
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak(utterance: SpeechSynthesisUtterance) { target.ikigaiSpeech.push(utterance.text); } } });
    window.fetch = async (url, options) => {
      if (url !== '/api/companion') return original(url, options);
      target.ikigaiStreamRequests.push(JSON.parse(String(options?.body)));
      return new Response(new ReadableStream<Uint8Array>({ start(controller) { target.ikigaiStream = controller; controller.enqueue(new TextEncoder().encode('{"type":"start","provider":"ubot"}\n')); }, cancel() { target.ikigaiStreamCancelled += 1; } }), { headers: { 'Content-Type': 'application/x-ndjson' } });
    };
  });
  await page.goto(width < 900 ? '/mobile' : '/desktop');
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
}
async function emit(page: Page, event: object, close = false) {
  await page.evaluate(({ event, close }) => { const controller = (window as StreamWindow).ikigaiStream!; controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`)); if (close) controller.close(); }, { event, close });
}
async function ask(page: Page, text = 'Save $25 in my gold goal') { await page.locator('#ai-question').fill(text); await page.locator('.ai-send').click(); await expect.poll(() => page.evaluate(() => Boolean((window as StreamWindow).ikigaiStream))).toBe(true); }

test('browser renders arriving text but withholds actions and speech until validated completion', async ({ page }) => {
  await openStream(page); await page.getByLabel('Read replies aloud', { exact: true }).check(); await ask(page);
  await emit(page, { type: 'text', text: 'We can review a $25 sample goal.' });
  await expect(page.locator('.ai-message-preview')).toContainText('streaming draft');
  await expect(page.locator('.ai-message-preview')).toContainText('We can review');
  await expect(page.getByRole('button', { name: 'Review this example', exact: true })).toHaveCount(0);
  await expect(page.locator('.ai-message-preview button')).toHaveCount(0);
  expect(await page.evaluate(() => (window as StreamWindow).ikigaiSpeech)).toEqual([]);
  const complete = { ...result('We can review a $25 sample goal.'), plan: { kind: 'save_gold', screen: 'passion', amountUsd: 25, title: 'Review a sample goal', why: 'You requested this amount.' } };
  await emit(page, { type: 'done', result: complete }, true);
  await expect(page.locator('.ai-message-preview')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Review this example', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as StreamWindow).ikigaiSpeech)).toEqual(['We can review a $25 sample goal.']);
  await page.getByRole('button', { name: 'Review this example', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Review your action', exact: true })).toContainText('$25');
  await expect(page.locator('.mobile-balance-card')).toContainText('$2,809.78');
});

test('Stop cancels streamed output, retains a labeled incomplete draft, and excludes it from follow-up context', async ({ page }) => {
  await openStream(page); await ask(page, 'Help me find a first step');
  await emit(page, { type: 'text', text: 'THIS IS AN UNFINISHED DRAFT' });
  await expect(page.locator('.ai-message-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('.ai-message-preview')).toContainText('Incomplete draft');
  await expect(page.locator('.ai-chat-error[role="alert"]')).toContainText('Stopped');
  await expect.poll(() => page.evaluate(() => (window as StreamWindow).ikigaiStreamCancelled)).toBe(1);
  await ask(page, 'What should I try instead?');
  expect(JSON.stringify(await page.evaluate(() => (window as StreamWindow).ikigaiStreamRequests.at(-1)))).not.toContain('UNFINISHED');
  await emit(page, { type: 'done', result: result('Try one free activity.') }, true);
  await expect(page.locator('.ai-message.assistant')).toContainText('Try one free activity.');
  await expect(page.locator('.ai-chat-fallback')).toHaveCount(0);
});

test('mid-stream failures stay visibly incomplete without automatic fallback, speech or financial proposals', async ({ page }) => {
  await openStream(page, 320); await ask(page);
  await emit(page, { type: 'text', text: 'A partial explanation that must not authorize anything.' });
  await emit(page, { type: 'error', code: 'upstream_error' }, true);
  await expect(page.locator('.ai-chat-error[role="alert"]')).toContainText('connection ended');
  await expect(page.locator('.ai-message-preview')).toContainText('Incomplete draft');
  await expect(page.locator('.ai-chat-fallback')).toHaveCount(0);
  await expect(page.locator('.ai-plan')).toHaveCount(0);
  expect(await page.evaluate(() => (window as StreamWindow).ikigaiSpeech)).toEqual([]);
  expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('new conversation discards a streamed draft and prevents its use in the next request', async ({ page }) => {
  await openStream(page); await ask(page, 'First question');
  await emit(page, { type: 'text', text: 'DISCARDED DRAFT' });
  await expect(page.locator('.ai-message-preview')).toBeVisible();
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  await expect(page.locator('.ai-message-preview')).toHaveCount(0);
  await expect(page.locator('.ai-message')).toHaveCount(0);
  await ask(page, 'Fresh question');
  const last = await page.evaluate(() => (window as StreamWindow).ikigaiStreamRequests.at(-1));
  expect(last?.messages).toEqual([{ role: 'user', text: 'Fresh question' }]);
  await emit(page, { type: 'done', result: result('A fresh answer.') }, true);
  await expect(page.locator('.ai-message.assistant')).toContainText('A fresh answer.');
});

test('status labels distinguish credentials, missing configuration and an actual live answer', () => {
  for (const language of ['en', 'th', 'es'] as const) {
    const labels = [aiAvailabilityLabel(language, false, null), aiAvailabilityLabel(language, false, false), aiAvailabilityLabel(language, false, true), aiAvailabilityLabel(language, false, true, true), aiAvailabilityLabel(language, true, true, true)];
    expect(new Set(labels).size).toBe(5);
    for (const label of labels) expect(label.length).toBeGreaterThan(15);
  }
  expect(aiAvailabilityLabel('en', false, true)).toContain('configured');
  expect(aiAvailabilityLabel('en', false, true)).not.toContain('Live reply');
  expect(aiAvailabilityLabel('en', false, true, true)).toContain('Live reply received');
});

test('an unavailable status check never claims a verified connection or prevents trying a live reply', async ({ page }) => {
  await page.route('**/api/agent', (route) => route.fulfill({ status: 504, json: { code: 'unavailable' } }));
  await openStream(page, 320);
  await expect(page.locator('.ai-source-bar')).toContainText('not checked');
  await ask(page, 'Help me think');
  await emit(page, { type: 'done', result: result('One real request still works.') }, true);
  await expect(page.locator('.ai-source-bar')).toContainText('Live reply received');
  expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
