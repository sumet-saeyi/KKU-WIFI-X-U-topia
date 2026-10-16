import type { PendingSignatureRequest, WalletState } from './types';

export type WalletError = 'pending' | 'balance' | 'cap' | 'invalid' | 'card_frozen';
const cents = (value: number) => Math.round(value * 100) / 100;
export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

export function refreshSpendingDay(wallet: WalletState, date = new Date()): WalletState {
  const today = dayKey(date);
  return wallet.spendingDay && wallet.spendingDay !== today
    ? { ...wallet, spentTodayUsd: 0, spendingDay: today }
    : { ...wallet, spendingDay: today };
}

export function validateRequest(wallet: WalletState, request: PendingSignatureRequest): WalletError | null {
  if (!Number.isFinite(request.usdValue) || request.usdValue <= 0) return 'invalid';
  const action = request.onConfirmAction;
  if (!['FUND_GOLD_GOAL', 'FUND_SILVER_GOAL', 'FUND_STOCK_GOAL', 'PAY_THB_BILL', 'ORDER_FRIDGE_GROCERIES', 'SPLIT_INCOME'].includes(action)) return 'invalid';
  if ((action === 'PAY_THB_BILL' && request.usdValue !== 13.5) || (action === 'ORDER_FRIDGE_GROCERIES' && request.usdValue !== 37.5) || (action === 'SPLIT_INCOME' && request.usdValue !== 105)) return 'invalid';
  if (action === 'ORDER_FRIDGE_GROCERIES' && wallet.cardFrozen) return 'card_frozen';
  if (action.startsWith('FUND_') && request.usdValue > wallet.balances.USDT) return 'balance';
  if (request.isAutomated && cents(wallet.spentTodayUsd + request.usdValue) > wallet.dailyAiCapUsd) return 'cap';
  if (action === 'PAY_THB_BILL' || action === 'ORDER_FRIDGE_GROCERIES') {
    if (cents(wallet.spentTodayUsd + request.usdValue) > wallet.dailyAiCapUsd) return 'cap';
    if (wallet.balances.THB < (action === 'PAY_THB_BILL' ? 450 : 1250)) return 'balance';
  }
  if (action === 'SPLIT_INCOME') {
    const split = wallet.ikigaiSplit;
    if (split.professionPct + split.passionPct + split.vocationPct + split.missionPct !== 100) return 'invalid';
  }
  return null;
}

export function confirmWalletRequest(wallet: WalletState, date = new Date()): { wallet: WalletState; error: WalletError | null } {
  const current = refreshSpendingDay(wallet, date);
  const pending = current.pendingSignature;
  if (!pending) return { wallet: current, error: null };
  const error = validateRequest(current, pending);
  if (error) return { wallet: { ...current, pendingSignature: null }, error };
  const next: WalletState = {
    ...current,
    balances: { ...current.balances },
    vaultBalancesUsd: { ...current.vaultBalancesUsd },
    stockBalancesUsd: { AMZN: 0, TSLA: 0, ...current.stockBalancesUsd },
    pendingSignature: null,
    ikigaiHarmonyScore: Math.min(100, current.ikigaiHarmonyScore + 2),
  };
  const action = pending.onConfirmAction;
  if (action.startsWith('FUND_')) {
    next.balances.USDT = cents(next.balances.USDT - pending.usdValue);
    if (action === 'FUND_GOLD_GOAL') next.balances.UGOLD = cents(next.balances.UGOLD + pending.usdValue);
    if (action === 'FUND_SILVER_GOAL') next.balances.BLKSLV = cents(next.balances.BLKSLV + pending.usdValue);
    if (action === 'FUND_STOCK_GOAL') {
      const symbol = pending.assetSymbol === 'TSLA' ? 'TSLA' : 'AMZN';
      next.stockBalancesUsd![symbol] = cents(next.stockBalancesUsd![symbol] + pending.usdValue);
    }
    next.vaultBalancesUsd.passion = cents(next.vaultBalancesUsd.passion + pending.usdValue);
    if (pending.isAutomated) next.spentTodayUsd = cents(next.spentTodayUsd + pending.usdValue);
  } else if (action === 'SPLIT_INCOME') {
    next.balances.THB += 3500;
    next.totalUsdValue = cents(next.totalUsdValue + pending.usdValue);
    const split = next.ikigaiSplit;
    const passion = cents(pending.usdValue * split.passionPct / 100);
    const vocation = cents(pending.usdValue * split.vocationPct / 100);
    const mission = cents(pending.usdValue * split.missionPct / 100);
    next.vaultBalancesUsd.passion = cents(next.vaultBalancesUsd.passion + passion);
    next.vaultBalancesUsd.vocation = cents(next.vaultBalancesUsd.vocation + vocation);
    next.vaultBalancesUsd.mission = cents(next.vaultBalancesUsd.mission + mission);
    next.vaultBalancesUsd.profession = cents(next.vaultBalancesUsd.profession + pending.usdValue - passion - vocation - mission);
  } else {
    next.balances.THB -= action === 'PAY_THB_BILL' ? 450 : 1250;
    next.totalUsdValue = cents(next.totalUsdValue - pending.usdValue);
    next.vaultBalancesUsd.profession = cents(next.vaultBalancesUsd.profession - pending.usdValue);
    next.spentTodayUsd = cents(next.spentTodayUsd + pending.usdValue);
  }
  next.transactions = [{
    id: pending.id,
    title: pending.title,
    pillar: pending.pillar,
    amountText: `${action === 'SPLIT_INCOME' ? '+' : '−'}${pending.amountText}`,
    usdEquivalent: pending.usdValue,
    feeSavedText: pending.feeComparison,
    txHash: `demo-${pending.id}`,
    timestamp: date.toISOString(),
    chain: 'Local demo receipt · Fuji contract design',
    ...(action === 'ORDER_FRIDGE_GROCERIES' ? { paymentMethod: 'utopia-card' as const } : {}),
  }, ...current.transactions].slice(0, 50);
  return { wallet: next, error: null };
}

export function completeAcademy(wallet: WalletState, courseId: string): WalletState {
  if (wallet.completedCourses?.includes(courseId)) return wallet;
  return { ...wallet, academyXp: wallet.academyXp + 50, ikigaiHarmonyScore: Math.min(100, wallet.ikigaiHarmonyScore + 4), completedCourses: [...(wallet.completedCourses ?? []), courseId] };
}

export function isStoredWallet(value: unknown): value is WalletState {
  if (!value || typeof value !== 'object') return false;
  const wallet = value as WalletState;
  return typeof wallet.totalUsdValue === 'number' && Number.isFinite(wallet.totalUsdValue)
    && ['USDT', 'THB', 'AUD', 'MXN', 'UGOLD', 'BLKSLV'].every((key) => typeof wallet.balances?.[key as keyof WalletState['balances']] === 'number' && Number.isFinite(wallet.balances[key as keyof WalletState['balances']]) && wallet.balances[key as keyof WalletState['balances']] >= 0)
    && ['profession', 'passion', 'vocation', 'mission'].every((key) => Number.isFinite(wallet.vaultBalancesUsd?.[key as keyof WalletState['vaultBalancesUsd']]))
    && ['professionPct', 'passionPct', 'vocationPct', 'missionPct'].every((key) => Number.isFinite(wallet.ikigaiSplit?.[key as keyof WalletState['ikigaiSplit']]) && wallet.ikigaiSplit[key as keyof WalletState['ikigaiSplit']] >= 0)
    && Number.isFinite(wallet.academyXp) && wallet.academyXp >= 0
    && Number.isFinite(wallet.ikigaiHarmonyScore) && wallet.ikigaiHarmonyScore >= 0 && wallet.ikigaiHarmonyScore <= 100
    && Number.isFinite(wallet.dailyAiCapUsd) && wallet.dailyAiCapUsd >= 0
    && Number.isFinite(wallet.spentTodayUsd) && wallet.spentTodayUsd >= 0 && Array.isArray(wallet.transactions)
    && wallet.transactions.every((tx) => tx && typeof tx.id === 'string' && typeof tx.title === 'string' && typeof tx.timestamp === 'string' && typeof tx.amountText === 'string' && ['passion', 'vocation', 'mission', 'profession'].includes(tx.pillar))
    && (!wallet.activeRules || (Array.isArray(wallet.activeRules) && wallet.activeRules.every((rule) => typeof rule === 'string')))
    && (!wallet.completedCourses || (Array.isArray(wallet.completedCourses) && wallet.completedCourses.every((course) => typeof course === 'string')))
    && (wallet.cardFrozen === undefined || typeof wallet.cardFrozen === 'boolean')
    && (!wallet.stockBalancesUsd || (Number.isFinite(wallet.stockBalancesUsd.AMZN) && Number.isFinite(wallet.stockBalancesUsd.TSLA)));
}
