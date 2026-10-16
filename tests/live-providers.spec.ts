import { expect, test } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { POST as agent } from '../src/app/api/agent/route';
import { POST as companion } from '../src/app/api/companion/route';
import { POST as speech } from '../src/app/api/tts/route';
import { companionContext } from '../src/lib/companion';
import { initialWallet } from '../src/lib/presetData';
import { newUBotSession } from '../src/lib/ubot';

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
