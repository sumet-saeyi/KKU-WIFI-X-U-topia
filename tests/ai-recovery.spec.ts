import { expect, test, type Page } from './fixtures';
import { companionContext, isCompanionCancellation, requestedDollars, restrictCompanionPlan } from '../src/lib/companion';
import { initialWallet } from '../src/lib/presetData';

type VoiceWindow = typeof window & { ikigaiVoiceCalls: string[] };
const answer = { text: 'One free step is to list what your little studio really needs.', source: 'live', latencyMs: 1, followUps: [], plan: { kind: 'none', screen: 'home', amountUsd: null, title: '', why: '' } };

async function open(page: Page, mode = 'normal', configured: boolean | null = true) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((mode) => {
    const target = window as VoiceWindow; target.ikigaiVoiceCalls = [];
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      cancel() { if (mode === 'cancel-error') throw new Error('device-cancel-failed'); },
      getVoices() { if (mode === 'voices-error') throw new Error('device-voices-failed'); return mode === 'english-only' ? [{ lang: 'en-US', name: 'English device voice' }] : []; },
      speak(utterance: SpeechSynthesisUtterance) {
        if (mode === 'speak-error') throw new Error('device-speak-failed');
        target.ikigaiVoiceCalls.push(utterance.text);
        if (mode === 'async-error') queueMicrotask(() => utterance.onerror?.call(utterance, { error: 'synthesis-failed' } as SpeechSynthesisErrorEvent));
      },
    } });
  }, mode);
  await page.route('**/api/agent', (route) => configured === null ? route.fulfill({ status: 504 }) : route.fulfill({ json: { configured, provider: 'ubot', speech: { configured: false } } }));
  await page.route('**/api/companion', (route) => route.fulfill({ json: answer }));
  await page.goto('/mobile');
  await page.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
}
async function ask(page: Page) { await page.locator('#ai-question').fill('Help me choose a free small step'); await page.locator('.ai-send').click(); }

test('turning read-aloud off while waiting prevents a late reply from speaking', async ({ page }) => {
  await open(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/companion', async (route) => { await pending; await route.fulfill({ json: answer }); });
  await page.getByLabel('Read replies aloud', { exact: true }).check();
  await ask(page); await expect(page.locator('.ai-thinking')).toBeVisible();
  await page.getByLabel('Read replies aloud', { exact: true }).uncheck();
  release();
  await expect(page.locator('.ai-message.assistant')).toBeVisible();
  expect(await page.evaluate(() => (window as VoiceWindow).ikigaiVoiceCalls)).toEqual([]);
});

test('turning read-aloud on while waiting applies to the completed reply', async ({ page }) => {
  await open(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/companion', async (route) => { await pending; await route.fulfill({ json: answer }); });
  await ask(page); await expect(page.locator('.ai-thinking')).toBeVisible();
  await page.getByLabel('Read replies aloud', { exact: true }).check(); release();
  await expect.poll(() => page.evaluate(() => (window as VoiceWindow).ikigaiVoiceCalls)).toEqual([answer.text]);
});

for (const mode of ['speak-error', 'voices-error', 'async-error']) {
  test(`device ${mode} keeps the answer readable and explains why no voice played`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
    await open(page, mode); await ask(page);
    await expect(page.locator('.ai-message.assistant')).toBeVisible();
    await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
    await expect(page.locator('.ai-chat-composer .voice-provider-note')).toContainText('Voice is unavailable');
    await expect(page.locator('.ai-chat-composer .voice-provider-note')).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Read aloud', exact: true })).toBeVisible();
    await expect(page.locator('.ai-message.assistant')).toContainText(answer.text);
    expect(errors).toEqual([]);
  });
}

test('a failing device cancellation API cannot break app startup or the next chat', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await open(page, 'cancel-error'); await ask(page);
  await expect(page.locator('.ai-message.assistant')).toContainText(answer.text);
  expect(errors).toEqual([]);
});

test('a device with no Thai voice explains the language limit instead of choosing English', async ({ page }) => {
  await open(page, 'english-only');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Close AI companion', exact: true }).click();
  await page.locator('.language-select select').selectOption('th');
  await page.getByRole('button', { name: 'ถามเพื่อน AI', exact: true }).click();
  await ask(page); await expect(page.locator('.ai-message.assistant')).toBeVisible();
  await page.getByRole('button', { name: 'อ่านให้ฟัง', exact: true }).click();
  await expect(page.locator('.ai-chat-composer .voice-provider-note')).toContainText('เสียงภาษานี้');
  await expect(page.locator('.ai-chat-composer .voice-provider-note')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => (window as VoiceWindow).ikigaiVoiceCalls)).toEqual([]);
});

for (const configured of [true, null]) {
  test(`the live indicator requires an actual reply when configuration is ${configured}`, async ({ page }) => {
    await open(page, 'normal', configured);
    await expect(page.locator('.ai-source-bar')).not.toHaveClass(/connected/);
    await ask(page); await expect(page.locator('.ai-source-bar')).toContainText('Live reply received');
    await expect(page.locator('.ai-source-bar')).toHaveClass(/connected/);
  });
}

test('negated financial intent is not converted into a sample money proposal in any supported language', () => {
  const context = companionContext(initialWallet, 'home');
  const proposal = { text: 'This is only a proposed review.', followUps: [], plan: { kind: 'save_gold' as const, screen: 'passion' as const, amountUsd: 25, title: 'Sample review', why: 'An amount was mentioned.' } };
  for (const text of ["I won't save $25 in gold", 'I am not asking to save $25 in gold', 'No ahorres $25 en oro', 'No quiero ahorrar $25 en oro', 'ฉันไม่อยากออม $25 ในทอง', 'ฉันไม่ออม $25 ในทอง', 'ฉันอย่าออม $25 ในทอง']) {
    expect(isCompanionCancellation(text)).toBe(true);
    expect(restrictCompanionPlan(proposal, { language: 'en', stageSafeMode: false, context, messages: [{ role: 'user', text }] }).plan.kind).toBe('none');
  }
  expect(isCompanionCancellation('อธิบายยอดเงินตัวอย่างของฉัน')).toBe(false);
  expect(requestedDollars('Quiero ahorrar 25 dólares en oro')).toBe(25);
});
