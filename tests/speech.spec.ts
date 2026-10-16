import { expect, test, type Page } from './fixtures';
import { POST as synthesize } from '../src/app/api/tts/route';

type VoiceWindow = typeof window & { cloudVoicePlayed: boolean; deviceVoiceUsed: boolean };
const answer = { text: 'One calm step is enough.', source: 'live', latencyMs: 1, followUps: [], plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } };

async function open(page: Page, status: boolean | null, deviceWorks = true) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((deviceWorks) => {
    const target = window as VoiceWindow;
    target.cloudVoicePlayed = false; target.deviceVoiceUsed = false;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak(utterance: SpeechSynthesisUtterance) { target.deviceVoiceUsed = true; if (!deviceWorks) queueMicrotask(() => utterance.onerror?.call(utterance, { error: 'synthesis-failed' } as SpeechSynthesisErrorEvent)); } } });
    class BrowserAudio {
      onended: (() => void) | null = null; onerror: (() => void) | null = null;
      play() { target.cloudVoicePlayed = true; return Promise.resolve(); }
      pause() {} removeAttribute() {}
    }
    window.Audio = BrowserAudio as unknown as typeof Audio;
  }, deviceWorks);
  await page.route('**/api/agent', (route) => status === null ? route.fulfill({ status: 504 }) : route.fulfill({ json: { configured: true, speech: { configured: status } } }));
  await page.route('**/api/companion', (route) => route.fulfill({ json: answer }));
  await page.goto('/mobile'); await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  await page.locator('#ai-question').fill('Help me start'); await page.locator('.ai-send').click();
  await expect(page.locator('.ai-message.assistant')).toBeVisible();
}

for (const [code, explanation] of [['not_configured', 'not connected on this site'], ['auth_failed', 'could not authorize'], ['quota_exceeded', 'used its online voice allowance'], ['voice_not_configured', 'selected online voice is unavailable'], ['busy', 'Online voice is busy']]) {
  test(`speech ${code} explains the actual problem when the device cannot read either`, async ({ page }) => {
    await page.route('**/api/tts', (route) => route.fulfill({ status: 503, json: { code } }));
    await open(page, false, false); await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
    const notice = page.locator('.ai-chat-composer .voice-provider-note');
    await expect(notice).toContainText(explanation); await expect(notice).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Read aloud', exact: true })).toBeVisible();
    await expect(page.locator('.ai-message.assistant')).toContainText(answer.text);
  });
}

const request = (language = 'en', signal?: AbortSignal) => new Request('http://localhost/api/tts', { method: 'POST', body: JSON.stringify({ text: 'One calm step.', language }), signal });

test('ElevenLabs SDK conversion uses MP3, preserves the example v2 model and selects v3 for Thai', async () => {
  const previousKey = process.env.ELEVENLABS_API_KEY; const previousModel = process.env.ELEVENLABS_MODEL_ID; const original = globalThis.fetch;
  process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-secret'; process.env.ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2';
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(String(options?.body)) });
    expect(new Headers(options?.headers).get('xi-api-key')).toBe('test-elevenlabs-secret');
    expect(options?.cache).toBe('no-store'); expect(options?.redirect).toBe('error');
    return new Response(new Uint8Array([73, 68, 51, 4]), { headers: { 'Content-Type': 'audio/mpeg' } });
  };
  try {
    for (const language of ['en', 'es', 'th']) {
      const response = await synthesize(request(language));
      expect(response.status).toBe(200); expect((await response.arrayBuffer()).byteLength).toBe(4);
      expect(calls.at(-1)?.url).toContain('output_format=mp3_44100_128');
      expect(calls.at(-1)?.body.model_id).toBe(language === 'th' ? 'eleven_v3' : 'eleven_multilingual_v2');
      expect(calls.at(-1)?.body.language_code).toBe(language === 'th' ? 'th' : undefined);
    }
  } finally {
    globalThis.fetch = original;
    if (previousKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.ELEVENLABS_MODEL_ID; else process.env.ELEVENLABS_MODEL_ID = previousModel;
  }
});

test('speech provider errors are safe, specific and never automatically retried', async () => {
  const previousKey = process.env.ELEVENLABS_API_KEY; const original = globalThis.fetch;
  process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-secret';
  let calls = 0;
  try {
    for (const [status, upstream, code] of [[401, 'invalid_api_key', 'auth_failed'], [401, 'quota_exceeded', 'quota_exceeded'], [404, 'voice_not_found', 'voice_not_configured'], [429, 'too_many_concurrent_requests', 'busy'], [503, 'internal_error', 'speech_unavailable']] as const) {
      globalThis.fetch = async () => { calls += 1; return Response.json({ detail: { status: upstream, message: 'private provider details and test-elevenlabs-secret' } }, { status }); };
      const before = calls; const response = await synthesize(request());
      expect(response.status).toBe(502); expect(await response.json()).toEqual({ code }); expect(calls - before).toBe(1);
    }
    globalThis.fetch = async () => new Response('Not audio', { headers: { 'Content-Type': 'text/plain' } });
    expect(await (await synthesize(request())).json()).toEqual({ code: 'invalid_audio' });
  } finally { globalThis.fetch = original; if (previousKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = previousKey; }
});

test('stopping speech cancels the pending SDK request without a retry', async () => {
  const previousKey = process.env.ELEVENLABS_API_KEY; const original = globalThis.fetch;
  process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-secret';
  let calls = 0; let started = () => {}; const pending = new Promise<void>((resolve) => { started = resolve; });
  globalThis.fetch = async (_url, options) => { calls += 1; return new Promise<Response>((_resolve, reject) => { options?.signal?.addEventListener('abort', () => reject(new DOMException('Stopped', 'AbortError')), { once: true }); started(); }); };
  try {
    const controller = new AbortController(); const response = synthesize(request('en', controller.signal));
    await pending; controller.abort();
    expect(await (await response).json()).toEqual({ code: 'cancelled' }); expect(calls).toBe(1);
  } finally { globalThis.fetch = original; if (previousKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = previousKey; }
});

for (const status of [false, null]) {
  test(`online speech tries ElevenLabs even when the status probe is ${status}`, async ({ page }) => {
    let requests = 0;
    await page.route('**/api/tts', (route) => { requests += 1; return route.fulfill({ contentType: 'audio/mpeg', body: Buffer.from('ID3test') }); });
    await open(page, status);
    await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
    await expect.poll(() => requests).toBe(1);
    await expect(page.locator('.ai-chat-composer .voice-provider-note')).toContainText('ElevenLabs voice');
    expect(await page.evaluate(() => (window as VoiceWindow).cloudVoicePlayed)).toBe(true);
    expect(await page.evaluate(() => (window as VoiceWindow).deviceVoiceUsed)).toBe(false);
  });
}
