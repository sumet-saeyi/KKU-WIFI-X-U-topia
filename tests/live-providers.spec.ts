import { expect, test } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { POST as agent } from '../src/app/api/agent/route';
import { POST as companion } from '../src/app/api/companion/route';
import { POST as speech } from '../src/app/api/tts/route';
import { companionContext } from '../src/lib/companion';
import { initialWallet } from '../src/lib/presetData';
import { newUBotSession } from '../src/lib/ubot';
import { readCompanionResponse } from '../src/lib/companionStream';

loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const post = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body) });

test('opt-in real U-Bot replies and follow-up context', async () => {
  test.skip(process.env.TEST_LIVE_UBOT !== '1', 'Requires explicit opt-in and configured U-Bot credentials; never substitutes a mock.');
  test.setTimeout(120000);
  const response = await agent(post('/api/agent', { stageSafeMode: false, language: 'en', kind: 'coach-creator', prompt: 'Explain in one short sentence why this sample wallet needs my approval before any action.' }));
  expect(response.status).toBe(200); const first = await response.json(); expect(first.provider).toBe('ubot'); expect(first.source).toBe('live'); expect(first.text.length).toBeGreaterThan(10);
  const base = { stageSafeMode: false, language: 'en', sessionId: newUBotSession(), context: companionContext(initialWallet, 'home') };
  const messages = [{ role: 'user', text: 'My goal is a little art studio. Ask one short question to help me plan without moving money.' }];
  const initial = await companion(post('/api/companion', { ...base, messages })); expect(initial.status).toBe(200); const reply = await initial.json();
  expect(reply.source).toBe('live'); expect(reply.provider).toBe('ubot');
  const follow = await companion(post('/api/companion', { ...base, messages: [...messages, { role: 'assistant', text: reply.text }, { role: 'user', text: 'What goal did I mention? Reply in one sentence.' }] }));
  expect(follow.status).toBe(200); const result = await follow.json(); expect(result.text).toMatch(/studio/i); expect(result.plan.kind).toBe('none');
});

test('opt-in real ElevenLabs audio in English, Thai and Spanish', async () => {
  test.skip(process.env.TEST_LIVE_ELEVENLABS !== '1', 'Requires explicit opt-in and ELEVENLABS_API_KEY; device voice is not a live-provider verification.');
  test.setTimeout(120000);
  for (const [language, text] of [['en', 'One calm step.'], ['th', 'ค่อย ๆ ไปด้วยกัน'], ['es', 'Un paso tranquilo.']]) {
    const response = await speech(post('/api/tts', { text, language })); expect(response.status).toBe(200); expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  }
});

test('opt-in real ElevenLabs audio decodes and plays in the browser even with a failed status probe', async ({ page }) => {
  test.skip(process.env.TEST_LIVE_ELEVENLABS !== '1', 'Requires explicit opt-in and a configured ElevenLabs key; uses native browser audio without replacing playback.');
  test.setTimeout(150000);
  type Evidence = { event: string; duration: number; readyState: number };
  type VoiceWindow = typeof window & { realSpeechEvidence: Evidence[]; realSpeechBytes: number };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const target = window as VoiceWindow; target.realSpeechEvidence = []; target.realSpeechBytes = 0;
    window.Audio = new Proxy(window.Audio, { construct(Target, args) {
      const audio = Reflect.construct(Target, args) as HTMLAudioElement;
      // Inspect the same local blob the native player receives; intercepted streaming bodies may be unavailable through CDP.
      if (typeof args[0] === 'string' && args[0].startsWith('blob:')) void fetch(args[0]).then((response) => response.arrayBuffer()).then((body) => { target.realSpeechBytes = body.byteLength; });
      for (const event of ['loadedmetadata', 'playing', 'error']) audio.addEventListener(event, () => target.realSpeechEvidence.push({ event, duration: Number.isFinite(audio.duration) ? audio.duration : 0, readyState: audio.readyState }));
      return audio;
    } });
  });
  // Isolate real speech from U-Bot costs; do not replace /api/tts or native Audio.play.
  await page.route('**/api/agent', (route) => route.fulfill({ status: 504 }));
  const samples: Record<string, string> = { en: 'One calm step.', th: 'ค่อย ๆ ไปด้วยกัน', es: 'Un paso tranquilo.' };
  await page.route('**/api/companion', (route) => route.fulfill({ json: { text: samples[route.request().postDataJSON().language], source: 'live', latencyMs: 1, followUps: [], plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } } }));
  for (const [language, ask, read] of [['en', 'Ask AI companion', 'Read aloud'], ['th', 'ถามเพื่อน AI', 'อ่านให้ฟัง'], ['es', 'Preguntar al compañero de IA', 'Leer en voz alta']]) {
    await page.goto('/mobile'); await page.locator('.language-select select').selectOption(language);
    await page.getByRole('button', { name: ask, exact: true }).click();
    await page.locator('#ai-question').fill(samples[language]); await page.locator('.ai-send').click();
    await expect(page.locator('.ai-message.assistant')).toBeVisible();
    const pending = page.waitForResponse((response) => response.url().endsWith('/api/tts') && response.request().method() === 'POST', { timeout: 45000 });
    await page.getByRole('button', { name: read, exact: true }).click();
    const response = await pending; expect(response.status()).toBe(200); expect(response.headers()['x-speech-provider']).toBe('elevenlabs');
    await expect.poll(() => page.evaluate(() => (window as VoiceWindow).realSpeechEvidence.some((item) => item.event === 'playing')), { timeout: 15000 }).toBe(true);
    await expect.poll(() => page.evaluate(() => (window as VoiceWindow).realSpeechBytes)).toBeGreaterThan(1000);
    const bytes = await page.evaluate(() => (window as VoiceWindow).realSpeechBytes);
    const evidence = await page.evaluate(() => (window as VoiceWindow).realSpeechEvidence);
    expect(evidence.some((item) => item.duration > 0)).toBe(true); expect(evidence.some((item) => item.event === 'error')).toBe(false);
    await test.info().attach(`real-speech-${language}`, { body: JSON.stringify({ bytes, evidence }), contentType: 'application/json' });
  }
});

test('opt-in real U-Bot honors the Ikigai persona in Thai', async () => {
  test.skip(process.env.TEST_LIVE_UBOT !== '1', 'Requires explicit opt-in and a configured U-Bot account.');
  test.setTimeout(120000);
  const response = await companion(post('/api/companion', {
    stageSafeMode: false, language: 'th', sessionId: newUBotSession(), context: companionContext(initialWallet, 'home'),
    messages: [{ role: 'user', text: 'คุณคือใครและช่วยอะไรในแอปนี้ได้บ้าง แนะนำตัวสั้น ๆ โดยไม่ทำรายการใด ๆ' }],
  }));
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.source).toBe('live'); expect(result.provider).toBe('ubot');
  await test.info().attach('provider-persona-reply', { body: JSON.stringify({ text: result.text, plan: result.plan }), contentType: 'application/json' });
  expect(/U.?Pilot/i.test(result.text)).toBe(true); expect(/ikigai|อิคิไก/i.test(result.text)).toBe(true);
  expect(result.plan.kind).toBe('none');
});

test('opt-in real U-Bot stream transport returns a validated reply and records actual chunk timing', async ({ request }) => {
  test.skip(process.env.TEST_LIVE_UBOT !== '1', 'Requires explicit opt-in and a configured U-Bot account.');
  test.setTimeout(120000);
  const baseURL = test.info().project.use.baseURL!;
  // Native fetch keeps the response stream readable; the Playwright request API buffers it.
  const started = performance.now();
  const response = await fetch(`${baseURL}/api/companion`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
    body: JSON.stringify({ stageSafeMode: false, language: 'en', sessionId: newUBotSession(), context: companionContext(initialWallet, 'home'), messages: [{ role: 'user', text: 'I am a freelancer dreaming of a little creative studio. Explain three practical free steps I can take before saving or buying anything. Use about 150 words in short paragraphs, with a concrete example for each step. Do not propose a money action.' }] }),
    signal: AbortSignal.timeout(70000),
  });
  const checkpoints: { atMs: number; length: number }[] = [];
  const result = await readCompanionResponse(response, (text) => checkpoints.push({ atMs: Math.round(performance.now() - started), length: text.length }));
  expect(result.source).toBe('live'); expect(result.plan.kind).toBe('none'); expect(result.text.length).toBeGreaterThan(50);
  expect(checkpoints.length).toBeGreaterThan(0);
  const completedMs = Math.round(performance.now() - started);
  console.log(JSON.stringify({ provider: 'ubot', progressiveUpdates: checkpoints.length, firstLength: checkpoints[0]?.length, finalLength: result.text.length, firstTextMs: checkpoints[0]?.atMs, completedMs }));
  await test.info().attach('real-stream-timing', { body: JSON.stringify({ checkpoints, completedMs, finalLength: result.text.length }), contentType: 'application/json' });
  expect(checkpoints[0].atMs).toBeLessThanOrEqual(completedMs);
  expect(checkpoints.at(-1)!.length).toBeGreaterThan(0);
  // Provider-side batching is observable, not something the application may fake with a typing timer.
  if (process.env.TEST_REQUIRE_INCREMENTAL_UBOT === '1') expect(checkpoints.some((point) => point.length < result.text.length)).toBe(true);
  expect((await request.get('/api/agent')).ok()).toBe(true);
});
