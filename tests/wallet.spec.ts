import { expect, test } from '@playwright/test';
import { initialWallet, signatureRequest, stageSafeAnswer } from '../src/lib/presetData';
import { completeAcademy, confirmWalletRequest, refreshSpendingDay, validateRequest } from '../src/lib/wallet';
import { extractResponseText } from '../src/lib/agentResponse';
import { detectedRisks } from '../src/lib/community';
import { contractSource } from '../src/lib/contractSource';
import { readFileSync } from 'node:fs';
import solc from 'solc';
import { recordCall, sendFujiRecord, vaultAbi, type FujiSession } from '../src/lib/fuji';
import { Interface } from 'ethers';
import { POST } from '../src/app/api/agent/route';

test('all asset purchases preserve total value and track every holding', () => {
  let wallet = structuredClone(initialWallet);
  for (const action of ['FUND_GOLD_GOAL', 'FUND_SILVER_GOAL', 'FUND_STOCK_GOAL'] as const) {
    const request = signatureRequest(action, 25); request.assetSymbol = 'TSLA';
    const result = confirmWalletRequest({ ...wallet, pendingSignature: request }); expect(result.error).toBeNull(); wallet = result.wallet;
  }
  expect(wallet.totalUsdValue).toBe(initialWallet.totalUsdValue);
  expect(wallet.balances.USDT).toBe(1175);
  expect(wallet.balances.UGOLD).toBe(335);
  expect(wallet.balances.BLKSLV).toBe(245);
  expect(wallet.stockBalancesUsd?.TSLA).toBe(25);
  expect(wallet.vaultBalancesUsd.passion).toBe(443);
  expect(wallet.transactions).toHaveLength(3);
  expect(confirmWalletRequest(wallet).wallet.transactions).toHaveLength(3);
  expect(wallet.transactions[0].txHash).toMatch(/^demo-/);
});

test('cumulative cap, balance and midnight reset apply at confirmation', () => {
  const pending = signatureRequest('PAY_THB_BILL');
  expect(confirmWalletRequest({ ...structuredClone(initialWallet), spentTodayUsd: 90, pendingSignature: pending }).error).toBe('cap');
  expect(validateRequest({ ...structuredClone(initialWallet), balances: { ...initialWallet.balances, THB: 100 } }, pending)).toBe('balance');
  expect(validateRequest({ ...structuredClone(initialWallet), balances: { ...initialWallet.balances, USDT: 5 } }, signatureRequest('FUND_GOLD_GOAL', 25))).toBe('balance');
  const date = new Date('2026-10-16T00:00:01Z');
  const result = confirmWalletRequest({ ...structuredClone(initialWallet), spendingDay: '2026-10-15', spentTodayUsd: 100, pendingSignature: pending }, date);
  expect(result.error).toBeNull(); expect(result.wallet.spentTodayUsd).toBe(13.5);
  expect(result.wallet.balances.THB).toBe(18050);
  expect(result.wallet.vaultBalancesUsd.profession).toBe(728.5);
  expect(refreshSpendingDay(result.wallet, date).spentTodayUsd).toBe(13.5);
});

test('incoming split conserves all income and supports saved ratios', () => {
  const wallet = { ...structuredClone(initialWallet), ikigaiSplit: { professionPct: 45, passionPct: 25, vocationPct: 10, missionPct: 20 }, pendingSignature: signatureRequest('SPLIT_INCOME') };
  const result = confirmWalletRequest(wallet).wallet;
  expect(result.totalUsdValue).toBeCloseTo(initialWallet.totalUsdValue + 105);
  const total = Object.values(result.vaultBalancesUsd).reduce((a, b) => a + b, 0) - Object.values(initialWallet.vaultBalancesUsd).reduce((a, b) => a + b, 0);
  expect(total).toBe(105); expect(result.vaultBalancesUsd.passion - initialWallet.vaultBalancesUsd.passion).toBe(26.25);
});

test('academy reward is idempotent and harmony never exceeds 100', () => {
  const once = completeAcademy({ ...structuredClone(initialWallet), ikigaiHarmonyScore: 99 }, 'academy-intro');
  expect(completeAcademy(once, 'academy-intro').academyXp).toBe(170);
  expect(once.ikigaiHarmonyScore).toBe(100);
});

test('automated savings share the daily AI cap', () => {
  const request = { ...signatureRequest('FUND_GOLD_GOAL', 25), isAutomated: true };
  expect(validateRequest({ ...structuredClone(initialWallet), spentTodayUsd: 90 }, request)).toBe('cap');
  const result = confirmWalletRequest({ ...structuredClone(initialWallet), pendingSignature: request });
  expect(result.wallet.spentTodayUsd).toBe(39.5);
  expect(result.wallet.balances.USDT).toBe(1225);
});

test('official Responses wire format is parsed without assuming SDK helpers', () => {
  expect(extractResponseText({ output: [{ type: 'reasoning', summary: [] }, { type: 'message', content: [{ type: 'output_text', text: 'Hola' }, { type: 'output_text', text: 'Mundo' }] }] })).toBe('Hola\nMundo');
  expect(extractResponseText({ output: [] })).toBe('');
});

test('risky wording is detected in all three languages', () => {
  expect(detectedRisks('guaranteed passive dividends')).toHaveLength(2);
  expect(detectedRisks('รับประกัน กำไรแน่นอน')).toHaveLength(2);
  expect(detectedRisks('ganancias seguras sin riesgo')).toHaveLength(2);
  expect(detectedRisks('Come learn with our community')).toHaveLength(0);
  for (const language of ['en', 'th', 'es'] as const) expect(stageSafeAnswer('script-humans', language)).toContain('[0:00]');
});

test('contract matches specification and inspector, and compiles successfully', () => {
  const source = readFileSync('contracts/UIkigaiVault.sol', 'utf8');
  const specification = readFileSync('docs/04_AVALANCHE_AND_CONTRACT.md', 'utf8').split('```solidity\n')[1].split('```')[0];
  expect(source.trim()).toBe(specification.trim()); expect(contractSource.trim()).toBe(source.trim());
  const output = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'UIkigaiVault.sol': { content: source } }, settings: { outputSelection: { '*': { '*': ['abi'] } } } })));
  expect((output.errors ?? []).filter((item: { severity: string }) => item.severity === 'error')).toEqual([]);
  expect(output.contracts['UIkigaiVault.sol'].UIkigaiVault.abi.some((item: { name: string }) => item.name === 'verifyAndRecordAgentSpend')).toBe(true);
});

test('Fuji adapter encodes the supplied ABI and refuses wrong-chain writes', async () => {
  const account = '0x1111111111111111111111111111111111111111';
  const abi = new Interface(vaultAbi);
  for (const action of ['guardrail', 'split', 'spend', 'income', 'gift'] as const) {
    const call = recordCall(action, account, account);
    expect(abi.encodeFunctionData(call.method, call.args)).toMatch(/^0x[0-9a-f]+$/);
  }
  expect(recordCall('spend', account, account).args[2]).toBe(1350);
  expect(() => recordCall('gift', account, 'invalid')).toThrow('valid beneficiary');
  const session = { account, injected: { request: async ({ method }: { method: string }) => method === 'eth_chainId' ? '0x1' : [account] } } as unknown as FujiSession;
  await expect(sendFujiRecord(session, 'spend', account, () => {})).rejects.toThrow('network changed');
});

test('Fuji record adapter reports submitted and confirmed receipts without changing networks', async () => {
  const account = '0x1111111111111111111111111111111111111111';
  const hash = `0x${'a'.repeat(64)}`;
  let submitted = '';
  let called = false;
  const session = {
    account,
    injected: { request: async ({ method }: { method: string }) => method === 'eth_chainId' ? '0xa869' : [account] },
    contract: { recordIkigaiIncomeSplit: async (amount: number) => {
      expect(amount).toBe(10500); called = true;
      return { hash, wait: async (confirmations: number, timeout: number) => {
        expect(submitted).toBe(hash); expect(confirmations).toBe(1); expect(timeout).toBe(60000);
        return { status: 1, blockNumber: 42 };
      } };
    } },
  } as unknown as FujiSession;
  const receipt = await sendFujiRecord(session, 'income', account, (value) => { submitted = value; });
  expect(called).toBe(true); expect(receipt).toEqual({ hash, blockNumber: 42 });
});

test('live API handles real wire shape, Spanish instructions, images and upstream failures', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'unit-test-key';
  let input: Record<string, unknown> = {};
  try {
    globalThis.fetch = async (_url, options) => {
      input = JSON.parse(String(options?.body));
      return Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'Una explicación clara.' }] }] });
    };
    const req = (data: object) => new Request('http://localhost/api/agent', { method: 'POST', body: JSON.stringify({ stageSafeMode: false, language: 'es', ...data }) });
    const response = await POST(req({ prompt: 'Describe', image: 'data:image/png;base64,aGVsbG8=' }));
    expect(response.status).toBe(200); expect((await response.json()).text).toBe('Una explicación clara.');
    expect(input.instructions).toContain('Mexican Spanish'); expect(input.store).toBe(false);
    expect(JSON.stringify(input.input)).toContain('input_image');
    expect((await POST(req({ image: 'https://untrusted.invalid/photo.png' }))).status).toBe(400);
    globalThis.fetch = async () => Response.json({ output: [] });
    expect((await POST(req({ prompt: 'hello' }))).status).toBe(502);
    globalThis.fetch = async () => { throw new Error('offline'); };
    expect((await POST(req({ prompt: 'hello' }))).status).toBe(504);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
  }
});
