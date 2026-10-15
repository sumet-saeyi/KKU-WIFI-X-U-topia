import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, route = '/desktop') {
  await page.addInitScript(() => {
    const spoken: { text: string; lang: string }[] = [];
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak(utterance: SpeechSynthesisUtterance) { spoken.push({ text: utterance.text, lang: utterance.lang }); } } });
    Object.defineProperty(window, 'ikigaiSpoken', { value: spoken });
  });
  await page.goto(route);
  await expect(page.locator('.home-task.profession')).toBeVisible();
}
async function focus(page: Page, pillar: string) { await page.locator('#ikigai-focus').selectOption(pillar); }

test('task tabs support arrow keys, Home and End with matching panels', async ({ page }) => {
  await open(page); await page.locator('.home-task.profession').click();
  const pay = page.getByRole('tab', { name: 'Pay a bill', exact: true });
  await pay.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Receive money', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Receive money', exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Accept payments', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Accept payments', exact: true })).toBeVisible();
  await page.keyboard.press('Home'); await expect(pay).toBeFocused();
  await focus(page, 'mission');
  await page.getByRole('tab', { name: 'Write a post', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tabpanel', { name: 'Make a video', exact: true })).toBeVisible();
});

test('voice controls use the selected language and the automatic read-aloud preference', async ({ page }) => {
  await open(page); await page.locator('.home-task.profession').click();
  const spoken = () => page.evaluate(() => (window as typeof window & { ikigaiSpoken: { text: string; lang: string }[] }).ikigaiSpoken);
  expect((await spoken()).at(-1)?.lang).toBe('en-US');
  await page.getByRole('button', { name: 'Stop guide', exact: true }).click();
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('th');
  await focus(page, 'passion'); expect((await spoken()).at(-1)?.lang).toBe('th-TH');
  await page.getByRole('button', { name: 'เปิดการตั้งค่า', exact: true }).click();
  await page.getByRole('switch', { name: 'อ่านออกเสียง', exact: true }).click();
  await page.getByRole('button', { name: 'ปิดการตั้งค่า', exact: true }).click();
  const count = (await spoken()).length; await focus(page, 'vocation'); expect((await spoken()).length).toBe(count);
  await page.getByRole('button', { name: /ฟังสรุปบทเรียน/ }).click();
  expect((await spoken()).at(-1)?.lang).toBe('th-TH');
  await page.getByRole('combobox', { name: 'ภาษา', exact: true }).selectOption('es');
  await page.getByRole('button', { name: /Escuchar el resumen/ }).click();
  expect((await spoken()).at(-1)?.lang).toBe('es-MX');
  expect((await spoken()).at(-1)!.text.length).toBeGreaterThan(30);
});

test('settings reset balances, progress, form choices and local practice state', async ({ page }) => {
  await open(page); await page.locator('.home-task.profession').click();
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  await page.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
  await page.getByRole('button', { name: 'Back to my day', exact: true }).click();
  await expect(page.locator('.balance-total')).toHaveText('$2,796.28');
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  await page.getByRole('switch', { name: 'Read aloud', exact: true }).click();
  await page.getByRole('button', { name: 'Start a fresh practice', exact: true }).click();
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
  await page.reload();
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Read aloud', exact: true })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('switch', { name: 'Offline practice', exact: true })).toHaveAttribute('aria-checked', 'true');
});

test('rules are optional, persist and prepare only explicitly approved examples', async ({ page }) => {
  await open(page); await page.locator('.home-task.profession').click();
  const rule = page.getByRole('switch', { name: /Save \$25 in my gold goal/ });
  await expect(rule).not.toBeVisible();
  await page.getByText('Make it a routine', { exact: true }).click();
  await rule.click(); await expect(rule).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: /Run example/ }).click();
  await expect(page.getByRole('dialog', { name: 'Review your action', exact: true })).toContainText('$25');
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
  await page.reload(); await page.locator('.home-task.profession').click();
  await page.getByText('Make it a routine', { exact: true }).click();
  await expect(rule).toHaveAttribute('aria-checked', 'true');
});

test('copy, QR save, print and mentor trace export are connected actions', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page); await page.locator('.home-task.mission').click();
  await page.getByRole('button', { name: /Scan & harmonize/ }).click();
  await page.getByRole('button', { name: 'Copy caption', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('U Academy');
  await page.getByRole('tab', { name: 'Make a video', exact: true }).click();
  await page.getByRole('button', { name: /Generate my story/ }).click();
  const qrDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Save QR', exact: true }).click();
  expect((await qrDownload).suggestedFilename()).toBe('u-ikigai-referral-qr.svg');
  await focus(page, 'profession'); await page.getByRole('tab', { name: 'Accept payments', exact: true }).click();
  await page.getByRole('button', { name: 'Generate payment card', exact: true }).click();
  await page.evaluate(() => { window.print = () => document.documentElement.setAttribute('data-printed', 'true'); });
  await page.getByRole('button', { name: 'Print card', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'true');
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Mentor Architecture View', exact: true }).click();
  await page.getByRole('tab', { name: /Tool traces/ }).click();
  const traceDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download JSON traces', exact: true }).click();
  expect((await traceDownload).suggestedFilename()).toBe('u-ikigai-traces.json');
  await expect(page.locator('.trace-card').first()).toContainText('createMerchantCard');
});

test('fresh and restricted-storage mobile sessions stay usable without hydration errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Disabled', 'SecurityError'); } }));
  await page.setViewportSize({ width: 320, height: 780 }); await open(page, '/');
  await expect(page.locator('.mobile-navigation')).toBeVisible();
  await page.locator('.home-task.profession').click();
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  await page.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
  await page.getByRole('button', { name: 'See my money', exact: true }).click();
  await expect(page.locator('.wallet-page-hero')).toContainText('$2,796.28');
  expect(errors).toEqual([]);
});

for (const language of ['en', 'th', 'es']) {
  test(`all task screens remain readable without overflow in ${language} at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 850 }); await open(page, '/mobile');
    await page.locator('.language-select select').selectOption(language);
    for (const pillar of ['profession', 'passion', 'vocation', 'mission']) {
      if (await page.locator('#ikigai-focus').isVisible()) await focus(page, pillar);
      else await page.locator(`.home-task.${pillar}`).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const readable = await page.locator(`#panel-${pillar} .module-header p`).evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(readable).toBeGreaterThanOrEqual(13);
    }
  });
}
