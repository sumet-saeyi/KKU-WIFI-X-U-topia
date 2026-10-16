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
