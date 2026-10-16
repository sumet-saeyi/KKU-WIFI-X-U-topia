import { expect, test, type Page } from './fixtures';
import { UBotClient, cleanUBotReply, pinnedUBotMessages, ubotApplicationRequest } from '../src/lib/ubot';
import { parseCompanionInput, parseUBotCompanionReply } from '../src/lib/companion';
import { speechChunks } from '../src/lib/tts';
import { GET as voiceStatus, POST as synthesize } from '../src/app/api/tts/route';

const question = { instructions: 'Explain simply.', messages: [{ role: 'user' as const, content: 'Hello' }] };
const session = (access = 'test-access', refresh = 'test-refresh', expires = 3600) => Response.json({ access_token: access, refresh_token: refresh, expires_in: expires });
const jwt = (payload: object) => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('U-Bot decodes split UTF-8 chunks and removes split status markers', async () => {
  const original = globalThis.fetch;
  const bytes = new TextEncoder().encode('[STATUS:thinking]สวัสดี — hola');
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } }));
  try { expect(await new UBotClient({ bearerToken: 'test-token' }).ask(question)).toBe('สวัสดี — hola'); }
  finally { globalThis.fetch = original; }
  expect(() => cleanUBotReply('[DEGENERATE]bad output')).toThrow('incomplete');
  expect(() => cleanUBotReply('[STATUS:working]')).toThrow('empty_response');
});

test('U-Bot discovers only the matching anonymous key and keeps credentials out of chat payloads', async () => {
  const original = globalThis.fetch;
  const wrong = jwt({ ref: 'other-project', role: 'anon' });
  const privileged = jwt({ ref: 'jspyarovtaqokysihujr', role: 'service_role' });
  const allowed = jwt({ ref: 'jspyarovtaqokysihujr', role: 'anon' });
  let authKey = ''; let payload = '';
  globalThis.fetch = async (url, options) => {
    const target = String(url);
    if (target === 'https://u.bot') return new Response('<script src="/_next/static/chunks/auth.js"></script>');
    if (target.endsWith('auth.js')) return new Response(`${wrong} ${privileged} ${allowed}`);
    if (target.includes('/token?')) { authKey = new Headers(options?.headers).get('apikey') || ''; return session(); }
    payload = String(options?.body); return new Response('A clear explanation.');
  };
  try {
    expect(await new UBotClient({ email: 'test@example.invalid', password: 'test-password', testerId: 'test-id' }).ask(question)).toBe('A clear explanation.');
    expect(authKey).toBe(allowed); expect(payload).not.toContain('test-password'); expect(payload).not.toContain('test@example.invalid'); expect(payload).not.toContain('test-access');
  } finally { globalThis.fetch = original; }
});

test('U-Bot refreshes expiring tokens and retries an unauthorized chat only once', async () => {
  const original = globalThis.fetch;
  let passwords = 0; let refreshes = 0; let chats = 0;
  const refreshBodies: string[] = [];
  globalThis.fetch = async (url, options) => {
    const target = String(url);
    if (target.includes('grant_type=password')) { passwords += 1; return session('initial', 'refresh-one', 1); }
    if (target.includes('grant_type=refresh_token')) { refreshBodies.push(String(options?.body)); refreshes += 1; return session(`renewed-${refreshes}`, `refresh-${refreshes + 1}`); }
    chats += 1; return chats === 2 ? new Response('', { status: 401 }) : new Response('Ready.');
  };
  try {
    const client = new UBotClient({ email: 'test@example.invalid', password: 'test-password', anonKey: 'sb_publishable_test' });
    await client.ask(question); await client.ask(question);
    expect(passwords).toBe(1); expect(refreshes).toBe(2); expect(chats).toBe(3);
    expect(refreshBodies[0]).toContain('refresh-one'); expect(refreshBodies[1]).toContain('refresh-2');
  } finally { globalThis.fetch = original; }
});

test('concurrent U-Bot questions share login but not conversation sessions', async () => {
  const original = globalThis.fetch;
  let logins = 0; const ids: string[] = [];
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('/token?')) { logins += 1; await Promise.resolve(); return session(); }
    ids.push(JSON.parse(String(options?.body)).sessionId); return new Response('Hello.');
  };
  try {
    const client = new UBotClient({ email: 'test@example.invalid', password: 'test-password', anonKey: 'sb_publishable_test' });
    await Promise.all([client.ask(question), client.ask(question), client.ask(question)]);
    expect(logins).toBe(1); expect(new Set(ids).size).toBe(3); expect(ids.every((id) => /^c_/.test(id))).toBe(true);
  } finally { globalThis.fetch = original; }
});

test('U-Bot does not retry billable requests on rate limits or leak upstream errors', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response('private provider details', { status: 429 }); };
  try { await expect(new UBotClient({ bearerToken: 'test-token' }).ask(question)).rejects.toThrow('busy'); expect(calls).toBe(1); }
  finally { globalThis.fetch = original; }
  const controller = new AbortController(); controller.abort();
  await expect(new UBotClient({ bearerToken: 'test-token' }).ask(question, controller.signal)).rejects.toThrow('connection_error');
});

test('bounded pinned history and unstructured U-Bot answers cannot invent wallet actions', () => {
  expect(pinnedUBotMessages(Array.from({ length: 16 }, (_, index) => index))).toEqual([0, 1, 8, 9, 10, 11, 12, 13, 14, 15]);
  expect(parseUBotCompanionReply('Let’s explain your choices.', 'wallet')?.plan.kind).toBe('none');
  expect(parseUBotCompanionReply('{"text":"Do it","plan":{"kind":"delete_wallet"}}', 'home')).toBeNull();
  expect(parseCompanionInput({ sessionId: '../../another-person' })).toBeNull();
  const chunks = speechChunks('ก'.repeat(8100)); expect(chunks.join('')).toHaveLength(8100); expect(chunks.every((chunk) => chunk.length <= 3500)).toBe(true);
  expect(() => new UBotClient({ anonKey: jwt({ ref: 'jspyarovtaqokysihujr', role: 'service_role' }) })).toThrow('auth_failed');
  expect(() => new UBotClient({ anonKey: jwt({ ref: 'different-project', role: 'anon' }) })).toThrow('auth_failed');
});

test('U-Bot userText includes the app persona and only bounded supplied conversation', () => {
  const messages = Array.from({ length: 16 }, (_, index) => ({ role: index % 2 === 0 ? 'user' as const : 'assistant' as const, content: `message-${index}-end` }));
  const text = ubotApplicationRequest({ instructions: 'Use the U-Pilot persona and the requested JSON format.', messages });
  expect(text).toContain('Use the U-Pilot persona'); expect(text).toContain('untrusted JSON data');
  for (const index of [0, 1, 8, 15]) expect(text).toContain(`message-${index}-end`);
  for (const index of [2, 3, 4, 5, 6, 7]) expect(text).not.toContain(`message-${index}-end`);
});

test('ElevenLabs route validates inputs and streams language-specific speech without exposing its key', async () => {
  const original = globalThis.fetch; const previous = process.env.ELEVENLABS_API_KEY;
  const oldVoice = process.env.ELEVENLABS_VOICE_ID_TH;
  const oldModel = process.env.ELEVENLABS_MODEL_ID;
  process.env.ELEVENLABS_API_KEY = 'test-eleven-secret'; process.env.ELEVENLABS_VOICE_ID_TH = 'ThaiVoiceForTesting'; delete process.env.ELEVENLABS_MODEL_ID;
  const requests: { url: string; input: Record<string, unknown> }[] = [];
  globalThis.fetch = async (url, options) => { requests.push({ url: String(url), input: JSON.parse(String(options?.body)) }); expect(new Headers(options?.headers).get('xi-api-key')).toBe('test-eleven-secret'); return new Response(new Uint8Array([73, 68, 51, 4]), { headers: { 'Content-Type': 'audio/mpeg' } }); };
  const req = (body: unknown) => new Request('http://localhost/api/tts', { method: 'POST', body: JSON.stringify(body) });
  try {
    for (const language of ['en', 'th', 'es']) {
      const response = await synthesize(req({ text: 'Hello', language }));
      expect(response.status).toBe(200); expect(response.headers.get('content-type')).toBe('audio/mpeg'); expect(response.headers.get('cache-control')).toBe('no-store'); expect((await response.arrayBuffer()).byteLength).toBe(4);
      expect(requests.at(-1)?.input.language_code).toBe(language); expect(requests.at(-1)?.input.model_id).toBe('eleven_v3');
    }
    expect(requests[1].url).toContain('ThaiVoiceForTesting');
    expect(JSON.stringify(await (await voiceStatus()).json())).not.toContain('test-eleven-secret');
    expect((await synthesize(req({ text: 'hi', language: 'xx' }))).status).toBe(400);
    expect((await synthesize(req({ text: 'x'.repeat(4001), language: 'en' }))).status).toBe(400);
    expect((await synthesize(new Request('http://localhost/api/tts', { method: 'POST', headers: { Origin: 'https://other.invalid' }, body: JSON.stringify({ text: 'hi', language: 'en' }) }))).status).toBe(403);
    globalThis.fetch = async () => new Response('private provider error', { status: 401 });
    expect(await (await synthesize(req({ text: 'hi', language: 'en' }))).json()).toEqual({ code: 'auth_failed' });
    delete process.env.ELEVENLABS_API_KEY; expect((await synthesize(req({ text: 'hi', language: 'en' }))).status).toBe(503);
  } finally {
    globalThis.fetch = original;
    for (const [name, value] of [['ELEVENLABS_API_KEY', previous], ['ELEVENLABS_VOICE_ID_TH', oldVoice], ['ELEVENLABS_MODEL_ID', oldModel]]) { if (value === undefined) delete process.env[name!]; else process.env[name!] = value; }
  }
});

async function prepareBrowser(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak(utterance: SpeechSynthesisUtterance) { document.documentElement.dataset.deviceVoice = utterance.lang; } } });
    class TestAudio {
      onended: (() => void) | null = null; onerror: (() => void) | null = null;
      play() { document.documentElement.dataset.cloudVoice = 'playing'; return Promise.resolve(); }
      pause() { document.documentElement.dataset.cloudVoice = 'stopped'; }
      removeAttribute() {}
    }
    window.Audio = TestAudio as unknown as typeof Audio;
  });
  await page.route('**/api/agent', (route) => route.fulfill({ json: { configured: true, provider: 'ubot', speech: { configured: true } } }));
  await page.route('**/api/companion', (route) => route.fulfill({ json: { text: 'A short clear answer.', source: 'live', followUps: [], latencyMs: 1, plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } } }));
  await page.goto('/mobile');
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.locator('#ai-question').fill('Explain this simply'); await page.locator('.ai-send').click(); await expect(page.locator('.ai-message.assistant')).toBeVisible();
}

test('connected read-aloud requests ElevenLabs and Stop disposes the audio', async ({ page }) => {
  let payload: Record<string, unknown> = {};
  await page.route('**/api/tts', (route) => { payload = route.request().postDataJSON(); return route.fulfill({ body: Buffer.from('ID3test'), contentType: 'audio/mpeg' }); });
  await prepareBrowser(page);
  await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cloud-voice', 'playing');
  await expect(page.locator('.ai-chat-composer .voice-provider-note')).toContainText('ElevenLabs voice');
  expect(payload).toEqual({ text: 'A short clear answer.', language: 'en' });
  await page.getByRole('button', { name: 'Stop reading', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cloud-voice', 'stopped');
});

test('missing ElevenLabs speech explicitly falls back to the device voice', async ({ page }) => {
  await page.route('**/api/tts', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
  await prepareBrowser(page); await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-device-voice', 'en-US');
  await expect(page.locator('.toast')).toContainText('ElevenLabs is unavailable');
  await expect(page.locator('.ai-chat-composer .voice-provider-note')).toContainText('Device voice');
});

test('closing the companion cancels pending cloud speech without late audio or fallback', async ({ page }) => {
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/tts', async (route) => { await pending; await route.fulfill({ body: Buffer.from('ID3late'), contentType: 'audio/mpeg' }).catch(() => {}); });
  await prepareBrowser(page); await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(page.locator('.ai-chat-composer .voice-provider-note')).toContainText('Preparing ElevenLabs');
  await page.getByRole('button', { name: 'Close AI companion', exact: true }).click(); release();
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Read aloud', exact: true })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-cloud-voice', 'playing');
  await expect(page.locator('html')).not.toHaveAttribute('data-device-voice', 'en-US');
});

test('connected mobile keeps reply space and expandable privacy details with the keyboard open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 460 }); await prepareBrowser(page);
  const history = await page.locator('.ai-chat-history').boundingBox(); expect(history!.height).toBeGreaterThanOrEqual(110);
  const send = await page.locator('.ai-send').boundingBox(); expect(send!.y + send!.height).toBeLessThanOrEqual(460);
  await page.locator('.ai-privacy-note summary').click();
  await expect(page.locator('.ai-privacy-note p').first()).toBeVisible();
  await expect(page.locator('.ai-privacy-note')).toContainText('up to 10 messages');
  await expect(page.locator('.ai-privacy-note')).toContainText('selected text with ElevenLabs');
});

test('New conversation changes the U-Bot session and clears bounded pinned messages', async ({ page }) => {
  await prepareBrowser(page);
  const requests: { sessionId: string; messages: { text: string }[] }[] = [];
  await page.route('**/api/companion', (route) => { requests.push(route.request().postDataJSON()); return route.fulfill({ json: { text: 'Understood.', source: 'live', followUps: [], latencyMs: 1, plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } } }); });
  for (let index = 0; index < 6; index += 1) {
    await page.locator('#ai-question').fill(`Follow-up ${index}`); await page.locator('.ai-send').click(); await expect(page.locator('.ai-message.assistant')).toHaveCount(index + 2);
  }
  expect(requests.at(-1)?.messages).toHaveLength(10); expect(requests.at(-1)?.messages[0].text).toBe('Explain this simply'); expect(new Set(requests.map((request) => request.sessionId)).size).toBe(1);
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  await page.locator('#ai-question').fill('Start fresh'); await page.locator('.ai-send').click(); await expect(page.locator('.ai-message.assistant')).toHaveCount(1);
  expect(requests.at(-1)?.messages).toHaveLength(1); expect(requests.at(-1)?.sessionId).not.toBe(requests[0].sessionId);
});
