import { expect, test, type Page } from './fixtures';
import { initialWallet, signatureRequest } from '../src/lib/presetData';
import { confirmWalletRequest, isStoredWallet, refreshSpendingDay, validateRequest } from '../src/lib/wallet';

const storedWallet = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('u-ikigai-product-v3')!).wallet);
async function openCard(page: Page, route = '/desktop') {
  await page.goto(route);
  await expect(page.locator('.home-task.profession')).toBeVisible();
  await page.getByRole('button', { name: 'Open U-topia card', exact: true }).click();
  await expect(page.locator('.utopia-card-panel')).toBeVisible();
}

test('freezing blocks card preparation and confirmation without changing sample money', () => {
  const pending = signatureRequest('ORDER_FRIDGE_GROCERIES');
  const wallet = { ...structuredClone(initialWallet), cardFrozen: true, pendingSignature: pending };
  expect(validateRequest(wallet, pending)).toBe('card_frozen');
  const result = confirmWalletRequest(wallet);
  expect(result.error).toBe('card_frozen');
  expect(result.wallet.pendingSignature).toBeNull();
  expect(result.wallet.balances).toEqual(initialWallet.balances);
  expect(result.wallet.totalUsdValue).toBe(initialWallet.totalUsdValue);
  expect(result.wallet.spentTodayUsd).toBe(initialWallet.spentTodayUsd);
  expect(result.wallet.transactions).toHaveLength(0);
  expect(validateRequest(wallet, signatureRequest('PAY_THB_BILL'))).toBeNull();
  expect(refreshSpendingDay({ ...wallet, spendingDay: '2026-10-15' }, new Date('2026-10-16T01:00:00Z')).cardFrozen).toBe(true);
});

test('card checkout uses existing baht and shared-cap invariants and tags only card receipts', () => {
  const pending = signatureRequest('ORDER_FRIDGE_GROCERIES');
  expect(validateRequest({ ...structuredClone(initialWallet), spentTodayUsd: 90 }, pending)).toBe('cap');
  expect(validateRequest({ ...structuredClone(initialWallet), balances: { ...initialWallet.balances, THB: 1249 } }, pending)).toBe('balance');
  const result = confirmWalletRequest({ ...structuredClone(initialWallet), pendingSignature: pending });
  expect(result.error).toBeNull();
  expect(result.wallet.balances.THB).toBe(17250);
  expect(result.wallet.totalUsdValue).toBe(2772.28);
  expect(result.wallet.spentTodayUsd).toBe(52);
  expect(result.wallet.transactions[0].paymentMethod).toBe('utopia-card');
  expect(result.wallet.transactions[0].txHash).toMatch(/^demo-/);
  expect(confirmWalletRequest(result.wallet).wallet.transactions).toHaveLength(1);
  const bill = confirmWalletRequest({ ...result.wallet, pendingSignature: signatureRequest('PAY_THB_BILL') });
  expect(bill.wallet.transactions[0].paymentMethod).toBeUndefined();
});

test('stored wallets accept older card-less state but reject non-boolean freeze values', () => {
  const { cardFrozen: _cardFrozen, ...legacy } = structuredClone(initialWallet);
  expect(isStoredWallet(legacy)).toBe(true);
  expect(isStoredWallet({ ...legacy, cardFrozen: true })).toBe(true);
  expect(isStoredWallet({ ...legacy, cardFrozen: false })).toBe(true);
  expect(isStoredWallet({ ...legacy, cardFrozen: 'false' })).toBe(false);
  expect(isStoredWallet({ ...legacy, cardFrozen: null })).toBe(false);
});

test('card has honest boundaries and checkout needs confirmation; cancellation spends nothing', async ({ page }) => {
  await openCard(page);
  const panel = page.locator('.utopia-card-panel');
  await expect(panel.getByRole('img')).toHaveAccessibleName(/demo card.*not an issued payment card/);
  await expect(panel).toContainText('Demo · not issued');
  await expect(panel).toContainText('No card number, real charges or issued card.');
  expect(await panel.textContent()).not.toMatch(/Visa|Mastercard|CVV|\b\d{4}[ -]\d{4}[ -]\d{4}/i);
  const before = await storedWallet(page);
  await panel.getByRole('button', { name: 'Try a grocery checkout' }).click();
  const review = page.getByRole('dialog', { name: 'Review your action', exact: true });
  await expect(review).toContainText('฿1,250');
  await expect(review).toContainText('U-topia card demo');
  expect((await storedWallet(page)).balances).toEqual(before.balances);
  await review.getByRole('button', { name: 'Not now', exact: true }).click();
  expect(await storedWallet(page)).toEqual(refreshSpendingDay(before));
  await panel.getByRole('button', { name: 'Try a grocery checkout' }).click();
  await review.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
  await page.getByRole('button', { name: 'See my money', exact: true }).click();
  await expect.poll(async () => (await storedWallet(page)).balances.THB).toBe(17250);
  const after = await storedWallet(page);
  expect(after.totalUsdValue).toBe(2772.28);
  expect(after.spentTodayUsd).toBe(52);
  expect(after.transactions).toHaveLength(1);
  expect(after.transactions[0].paymentMethod).toBe('utopia-card');
  await expect(panel.getByRole('progressbar')).toHaveAttribute('value', '52');
  await panel.locator('.card-last-payment').click();
  await expect(page.getByRole('dialog', { name: 'Your receipt', exact: true })).toContainText('Fresh grocery refill');
});

test('freeze survives a reload, unfreezes, and is cleared by a fresh practice', async ({ page }) => {
  await openCard(page);
  const panel = page.locator('.utopia-card-panel');
  await panel.getByRole('button', { name: 'Freeze card', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Unfreeze card', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByRole('button', { name: 'Try a grocery checkout' })).toBeDisabled();
  await expect.poll(async () => (await storedWallet(page)).cardFrozen).toBe(true);
  await openCard(page);
  await expect(panel.getByRole('status')).toHaveText('Frozen for now');
  await panel.getByRole('button', { name: 'Unfreeze card', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Try a grocery checkout' })).toBeEnabled();
  await panel.getByRole('button', { name: 'Freeze card', exact: true }).click();
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Start a fresh practice', exact: true }).click();
  await page.getByRole('button', { name: 'Open U-topia card', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Ready for practice');
  expect((await storedWallet(page)).balances.THB).toBe(18500);
  expect((await storedWallet(page)).cardFrozen).toBe(false);
});

test('frozen card cannot be bypassed through Smart fridge but U-Pay bills still work', async ({ page }) => {
  await openCard(page);
  await page.getByRole('button', { name: 'Freeze card', exact: true }).click();
  await page.getByRole('button', { name: 'Pay or receive', exact: true }).click();
  await page.getByRole('button', { name: /TRY AN EXAMPLE Smart fridge/ }).click();
  await expect(page.locator('.toast')).toContainText('demo card is frozen');
  await expect(page.getByRole('dialog', { name: 'Review your action', exact: true })).not.toBeVisible();
  expect((await storedWallet(page)).balances.THB).toBe(18500);
  await page.getByRole('button', { name: /TRY AN EXAMPLE Bangkok bill/ }).click();
  await expect(page.getByRole('dialog', { name: 'Review your action', exact: true })).toContainText('via U-Pay');
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await page.getByRole('button', { name: /Meet your U-topia card/ }).click();
  await expect(page.locator('.utopia-card-panel')).toBeVisible();
});

test('card controls explain the shared-cap boundary after two sample checkouts', async ({ page }) => {
  await openCard(page);
  const panel = page.locator('.utopia-card-panel');
  for (let attempt = 0; attempt < 2; attempt++) {
    await panel.getByRole('button', { name: 'Try a grocery checkout' }).click();
    await page.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
    await page.getByRole('button', { name: 'See my money', exact: true }).click();
  }
  await expect(panel.getByRole('button', { name: 'Try a grocery checkout' })).toBeDisabled();
  await expect(panel).toContainText('above today’s remaining shared limit');
  expect((await storedWallet(page)).spentTodayUsd).toBe(89.5);
  expect((await storedWallet(page)).transactions).toHaveLength(2);
});

for (const width of [320, 1440]) {
  for (const [language, freeze, unfreeze, checkout, heading] of [
    ['en', 'Freeze card', 'Unfreeze card', 'Try a grocery checkout', 'Your U-topia card.'],
    ['th', 'ระงับบัตร', 'ยกเลิกการระงับ', 'ลองชำระค่าของสด', 'บัตร U-topia ของคุณ'],
    ['es', 'Congelar tarjeta', 'Descongelar tarjeta', 'Probar un pago de alimentos', 'Tu tarjeta U-topia.'],
  ]) {
    test(`card controls fit ${width}px in ${language} with working localized actions`, async ({ page }) => {
      await page.setViewportSize({ width, height: 980 });
      await openCard(page, width < 900 ? '/mobile' : '/desktop');
      await page.locator('.language-select select').selectOption(language);
      const panel = page.locator('.utopia-card-panel');
      await expect(panel.getByRole('heading')).toHaveText(heading);
      const freezeButton = panel.getByRole('button', { name: freeze, exact: true });
      await freezeButton.click();
      await expect(panel.getByRole('button', { name: checkout, exact: true })).toBeDisabled();
      await panel.getByRole('button', { name: unfreeze, exact: true }).click();
      await expect(panel.getByRole('button', { name: checkout, exact: true })).toBeEnabled();
      expect(await panel.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth && element.scrollWidth <= element.clientWidth;
      })).toBe(true);
      for (const button of await panel.getByRole('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await panel.getByRole('button', { name: checkout, exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText('฿1,250');
      expect((await storedWallet(page)).transactions).toHaveLength(0);
    });
  }
}

test('cached card stays usable after an offline reload, including freeze and checkout', async ({ page, context }) => {
  test.skip(!process.env.TEST_PRODUCTION, 'Offline reload requires the production service worker.');
  await openCard(page, '/mobile');
  await page.getByRole('button', { name: 'Freeze card', exact: true }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(async () => page.evaluate(async () => {
    const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src],link[rel="stylesheet"]')].map((element) => 'src' in element ? element.src : element.href).filter((url) => url.includes('/_next/static/'));
    return (await Promise.all(assets.map((url) => caches.match(url)))).every(Boolean);
  })).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Open U-topia card', exact: true }).click();
  await expect(page.locator('.utopia-card-panel').getByRole('status')).toHaveText('Frozen for now');
  await page.getByRole('button', { name: 'Unfreeze card', exact: true }).click();
  await page.getByRole('button', { name: 'Try a grocery checkout', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, confirm', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'All done', exact: true })).toBeVisible();
  expect((await storedWallet(page)).balances.THB).toBe(17250);
});
