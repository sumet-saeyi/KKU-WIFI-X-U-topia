import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page, path = '/') {
  await page.addInitScript(() => {
    const synth = { cancel() {}, speak(utterance: SpeechSynthesisUtterance) { setTimeout(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent), 10); }, getVoices: () => [] };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
  });
  await page.goto(path);
  await expect(page.locator('.home-task.profession')).toBeVisible();
}
async function choose(page: Page, pillar: string) {
  if (await page.locator('#ikigai-focus').isVisible()) await page.locator('#ikigai-focus').selectOption(pillar);
  else await page.locator(`.home-task.${pillar}`).click();
  await expect(page.locator(`#panel-${pillar}`)).toBeVisible();
}
async function approve(page: Page) {
  await page.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'All done', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
}
async function openMentor(page: Page) {
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Mentor Architecture View', exact: true }).click();
}

test('demo payments, cancellation, persistence and receipts work', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page); await choose(page, 'profession');
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  const review = page.getByRole('dialog', { name: 'Review your action' });
  await expect(review).toBeVisible();
  await review.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  await approve(page); await expect(page.locator('.balance-total')).toHaveText('$2,796.28');
  await page.reload(); await expect(page.locator('.balance-total')).toHaveText('$2,796.28');
  await page.getByRole('button', { name: 'Open my money', exact: true }).click();
  await page.getByRole('tab', { name: /Recent activity/ }).click();
  await page.locator('.activity-row').first().click();
  await expect(page.getByRole('dialog', { name: 'Your receipt' })).toContainText('YOUR PRACTICE RECEIPT');
  expect(errors).toEqual([]);
});

test('all stage-safe actions work after network is disabled', async ({ page, context }) => {
  await openApp(page); await context.setOffline(true); await choose(page, 'vocation');
  await page.getByRole('button', { name: '✦ Ask my coach' }).click();
  await expect(page.locator('.coach-answer')).toContainText('As a creator');
  await choose(page, 'mission'); await page.getByRole('button', { name: /Scan & harmonize/ }).click();
  await expect(page.locator('.safe-copy')).toContainText('U Academy');
  await page.getByRole('tab', { name: 'Make a video', exact: true }).click();
  await page.getByRole('button', { name: /Generate my story/ }).click();
  await expect(page.locator('.script-copy')).toContainText('[0:00]');
  await choose(page, 'profession'); await page.getByRole('button', { name: /TRY AN EXAMPLE Smart fridge/ }).click();
  await expect(page.getByRole('dialog')).toContainText('฿1,250');
  await approve(page); await expect(page.locator('.balance-total')).toHaveText('$2,772.28');
});

test('saving uses three clear steps and preserves choices across navigation', async ({ page }) => {
  await openApp(page); await choose(page, 'passion');
  await expect(page.getByRole('button', { name: /Global Tech Companies/ })).not.toBeVisible();
  await page.getByRole('button', { name: /Someone I love/ }).click();
  await expect(page.getByRole('button', { name: 'Continue', exact: false })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Recipient’s name or phone' }).fill('Maya');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Global Tech Companies/ }).click();
  await page.getByRole('button', { name: 'Tesla', exact: true }).click();
  await choose(page, 'vocation');
  await page.getByRole('button', { name: /Stablecoin/ }).click();
  await page.getByRole('button', { name: /Tokenized real-world asset/ }).click();
  await page.getByRole('button', { name: /Complete my learning sandbox/ }).click();
  await expect(page.locator('.xp-pill')).toContainText('170');
  await choose(page, 'passion');
  await expect(page.getByRole('button', { name: 'Tesla', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('textbox', { name: 'Meaning note', exact: true }).fill('For your next adventure.');
  await page.getByRole('button', { name: /Review my saving plan/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Maya');
  await expect(page.getByRole('dialog')).toContainText('For your next adventure.');
  await approve(page); await choose(page, 'vocation');
  await expect(page.getByRole('button', { name: /Completed · 50 XP earned/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Open my money', exact: true }).click();
  await expect(page.locator('.wallet-balance-list')).toContainText('Tesla$25.00');
});

test('language switch translates selectors, modules, outputs and approvals', async ({ page }) => {
  await openApp(page); await choose(page, 'profession');
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('th');
  await expect(page.getByRole('heading', { name: 'เรื่องเงินทุกวัน ง่ายขึ้นอีกนิด' })).toBeVisible();
  await expect(page.locator('#ikigai-focus')).toContainText('จ่ายและรับเงิน');
  await page.getByRole('button', { name: /ลองตัวอย่าง บิลกรุงเทพฯ/ }).click();
  await expect(page.getByRole('dialog')).toContainText('ค่าไฟกรุงเทพฯ');
  await page.getByRole('button', { name: 'ไว้ก่อน', exact: true }).click();
  await page.getByRole('combobox', { name: 'ภาษา', exact: true }).selectOption('es');
  await choose(page, 'mission');
  await expect(page.getByRole('heading', { name: 'Comparte algo que importa' })).toBeVisible();
  await page.getByRole('tab', { name: 'Crear un video', exact: true }).click();
  await page.getByRole('button', { name: /Generar mi historia/ }).click();
  await expect(page.locator('.script-copy')).toContainText('Las finanzas');
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('th');
  await expect(page.locator('.script-copy')).toContainText('แอปการเงิน');
});

test('desktop and mobile use distinct homes, navigation, wallet and approval', async ({ page }) => {
  await openApp(page, '/desktop');
  await expect(page.locator('.desktop-navigation')).toBeVisible();
  await expect(page.getByRole('heading', { name: /A richer life/ })).toBeVisible();
  await page.getByRole('button', { name: 'Mobile', exact: true }).click();
  await expect(page.locator('main')).toHaveClass(/experience-mobile/);
  await expect(page.getByRole('heading', { name: /Your life/ })).toBeVisible();
  await expect(page.locator('.desktop-navigation')).not.toBeVisible();
  await expect(page.locator('.mobile-navigation')).toBeVisible();
  expect((await page.locator('.product-shell').boundingBox())?.width).toBe(430);
  await page.locator('.mobile-balance-card').click();
  await expect(page.getByRole('heading', { name: 'Your whole picture.' })).toBeVisible();
  await page.locator('.mobile-navigation').getByRole('button', { name: 'Pay', exact: true }).click();
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  await expect(page.locator('.approval-dialog')).toHaveClass(/mobile-dialog/);
  await approve(page);
  await page.locator('.mobile-navigation').getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.locator('.mobile-balance-card')).toContainText('$2,796.28');
  await page.getByRole('button', { name: 'Desktop', exact: true }).click();
  await expect(page.locator('.wallet-companion')).toBeVisible();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Ikigai selector is above its task, reachable and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await openApp(page);
    await choose(page, 'profession');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const pillar of ['passion', 'vocation', 'mission', 'profession']) {
      await page.locator('#ikigai-focus').selectOption(pillar);
      const selector = await page.locator('.ikigai-selector').boundingBox();
      const panel = await page.locator(`#panel-${pillar}`).boundingBox();
      expect(selector && panel && selector.y + selector.height < panel.y).toBe(true);
      expect(selector!.x).toBeGreaterThanOrEqual(0);
      expect(selector!.x + selector!.width).toBeLessThanOrEqual(width);
      const unobstructed = await page.locator('#ikigai-focus').evaluate((element) => { const r = element.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === element; });
      expect(unobstructed).toBe(true);
      await expect(page.locator(`#panel-${pillar}`)).toBeVisible();
    }
    await page.locator('#ikigai-focus').focus();
    await expect(page.locator('#ikigai-focus')).toBeFocused();
    if (width < 900) await expect(page.locator('main')).toHaveClass(/experience-mobile/);
  });
}

test('newcomer tour leads to a familiar, cancellable first payment', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Show me around', exact: true }).click();
  const guide = page.getByRole('dialog', { name: 'A little guidance', exact: true });
  await expect(guide).toContainText('A little less complicated.');
  await guide.getByRole('button', { name: /That makes sense/ }).click();
  await expect(guide).toContainText('450-baht');
  await guide.getByRole('button', { name: /That makes sense/ }).click();
  await guide.getByRole('button', { name: /Let’s try my first payment/ }).click();
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.balance-total')).toHaveText('$2,809.78');
});

test('plain-language helper and income allocation lead to real local actions', async ({ page }) => {
  await openApp(page); await page.getByRole('textbox', { name: 'What would you like help with?' }).fill('I want to save for my family');
  await page.getByRole('button', { name: 'Find my first step' }).click();
  await expect(page.locator('#ikigai-focus')).toHaveValue('passion');
  await choose(page, 'profession');
  await page.getByRole('tab', { name: 'Receive money', exact: true }).click();
  await expect(page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ })).not.toBeVisible();
  await page.getByRole('button', { name: /Simulate incoming 3,500 THB payment/ }).click();
  await approve(page);
  await expect(page.locator('.balance-total')).toHaveText('$2,914.78');
  await expect(page.locator('.companion-allocation')).toContainText('$794.50');
});

test('merchant QR opens a usable merchant payment flow', async ({ page }) => {
  await openApp(page); await choose(page, 'profession');
  await page.getByRole('tab', { name: 'Accept payments', exact: true }).click();
  await page.getByRole('textbox', { name: 'Business or creator name' }).fill('A & B Cafe');
  await page.getByRole('button', { name: 'Generate payment card', exact: true }).click();
  await expect(page.locator('.merchant-standee svg')).toBeVisible();
  await page.getByRole('link', { name: 'Try link', exact: true }).click();
  await expect(page.locator('.merchant-welcome')).toContainText('A & B Cafe');
  await page.getByRole('button', { name: /Try payment/ }).click();
  await expect(page.getByRole('dialog', { name: 'Review your action' })).toContainText('A & B Cafe');
  await page.keyboard.press('Escape');
});

test('mentor view exposes source and traces, and closes with Escape', async ({ page }) => {
  await openApp(page); await openMentor(page);
  const mentor = page.getByRole('dialog', { name: 'Mentor Architecture View' });
  await expect(mentor).toContainText('Optional live Fuji contract inspector');
  await mentor.getByRole('tab', { name: 'Smart contract' }).click();
  await expect(mentor.locator('code')).toContainText('contract UIkigaiVault');
  await page.keyboard.press('Escape'); await expect(mentor).not.toBeVisible();
});

test('mentor deployment offers the exact artifact and reports a missing browser wallet', async ({ page, request }) => {
  await openApp(page); await openMentor(page);
  const inspector = page.locator('.onchain-inspector');
  await expect(inspector.getByRole('link', { name: 'Download compiled ABI & bytecode' })).toHaveAttribute('href', '/contracts/UIkigaiVault.json');
  const artifactResponse = await request.get('/contracts/UIkigaiVault.json');
  expect(artifactResponse.ok()).toBe(true); const artifact = await artifactResponse.json();
  expect(artifact.contractName).toBe('UIkigaiVault'); expect(artifact.evmVersion).toBe('cancun');
  expect(artifact.bytecode).toMatch(/^0x[0-9a-f]+$/);
  await inspector.getByRole('button', { name: 'Deploy vault on Fuji with my wallet' }).click();
  await expect(inspector.getByRole('status')).toContainText('browser with an Ethereum-compatible wallet');
});

for (const path of ['/', '/mobile', '/desktop']) {
  test(`production cache supports an offline reload of ${path}`, async ({ page, context }) => {
    test.skip(!process.env.TEST_PRODUCTION, 'Service worker is enabled only in the production build.');
    await openApp(page, path); await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(async () => page.evaluate(async () => {
      const scripts = [...document.querySelectorAll<HTMLScriptElement>('script[src]')].map((script) => script.src).filter((src) => src.includes('/_next/static/'));
      return (await Promise.all(scripts.map((src) => caches.match(src)))).every(Boolean);
    })).toBe(true);
    await context.setOffline(true); await page.reload();
    await expect(page.locator('.home-task.vocation')).toBeVisible(); await choose(page, 'vocation');
    await page.getByRole('button', { name: '✦ Ask my coach' }).click();
    await expect(page.locator('.coach-answer')).toContainText('As a creator');
    if (path === '/mobile') await expect(page.locator('.mobile-navigation')).toBeVisible();
  });
}
test('agent API validates inputs and serves all offline languages', async ({ request }) => {
  expect((await request.post('/api/agent', { data: '{bad', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
  expect((await request.post('/api/agent', { data: { language: 'xx' } })).status()).toBe(400);
  expect((await request.post('/api/agent', { data: { stageSafeMode: 'false' } })).status()).toBe(400);
  for (const language of ['en', 'th', 'es']) {
    const response = await request.post('/api/agent', { data: { kind: 'coach', language, stageSafeMode: true } });
    expect(response.ok()).toBe(true); const data = await response.json(); expect(data.text.length).toBeGreaterThan(30); expect(data.source).toBe('stage-safe'); expect(data.latencyMs).toBeLessThan(150);
  }
  const config = await (await request.get('/api/agent')).json();
  if (!config.configured) expect((await request.post('/api/agent', { data: { stageSafeMode: false } })).status()).toBe(503);
});


