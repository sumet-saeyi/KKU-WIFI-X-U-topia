import { test, expect } from '@playwright/test';
import { createBlock } from '@ethereumjs/block';
import { createCustomCommon, Hardfork, Mainnet } from '@ethereumjs/common';
import { createLegacyTx } from '@ethereumjs/tx';
import { createAccount, createAddressFromPrivateKey, hexToBytes, bytesToHex } from '@ethereumjs/util';
import { createVM, runTx } from '@ethereumjs/vm';
import { Interface } from 'ethers';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

async function localVault() {
  const artifact = JSON.parse(readFileSync('public/contracts/UIkigaiVault.json', 'utf8'));
  const source = readFileSync('contracts/UIkigaiVault.sol', 'utf8');
  expect(artifact.sourceSha256).toBe(createHash('sha256').update(source).digest('hex'));
  expect(artifact.evmVersion).toBe('cancun');
  const common = createCustomCommon({ chainId: 43113 }, Mainnet, { hardfork: Hardfork.Cancun });
  const vm = await createVM({ common });
  // Public, disposable test-only identities exist solely in this isolated in-memory VM.
  const ownerKey = hexToBytes(`0x${'11'.repeat(32)}`);
  const agentKey = hexToBytes(`0x${'22'.repeat(32)}`);
  const strangerKey = hexToBytes(`0x${'33'.repeat(32)}`);
  const owner = createAddressFromPrivateKey(ownerKey);
  const agent = createAddressFromPrivateKey(agentKey);
  const stranger = createAddressFromPrivateKey(strangerKey);
  for (const address of [owner, agent, stranger]) await vm.stateManager.putAccount(address, createAccount({ balance: 10n ** 21n }));
  const blockAt = (timestamp = 1_700_000_000n) => createBlock({ header: { timestamp, gasLimit: 30_000_000n, baseFeePerGas: 7n } }, { common, skipConsensusFormatValidation: true });
  const deployment = createLegacyTx({ nonce: 0n, gasLimit: 6_000_000n, gasPrice: 1_000_000_000n, data: hexToBytes(artifact.bytecode) }, { common }).sign(ownerKey);
  const result = await runTx(vm, { tx: deployment, block: blockAt() });
  expect(result.execResult.exceptionError).toBeUndefined();
  expect(result.createdAddress).toBeDefined();
  const vaultAddress = result.createdAddress!;
  expect(bytesToHex(await vm.stateManager.getCode(vaultAddress))).toBe(artifact.deployedBytecode);
  const abi = new Interface(artifact.abi);
  const send = async (method: string, args: readonly unknown[], key = ownerKey, timestamp?: bigint) => {
    const sender = createAddressFromPrivateKey(key);
    const account = await vm.stateManager.getAccount(sender);
    const tx = createLegacyTx({ nonce: account!.nonce, to: vaultAddress, gasLimit: 3_000_000n, gasPrice: 1_000_000_000n, data: hexToBytes(abi.encodeFunctionData(method, args) as `0x${string}`) }, { common }).sign(key);
    return runTx(vm, { tx, block: blockAt(timestamp) });
  };
  const read = async (method: string, args: readonly unknown[]) => {
    const result = await vm.evm.runCall({ caller: owner, to: vaultAddress, isStatic: true, gasLimit: 1_000_000n, data: hexToBytes(abi.encodeFunctionData(method, args) as `0x${string}`), block: blockAt() });
    expect(result.execResult.exceptionError).toBeUndefined();
    return abi.decodeFunctionResult(method, bytesToHex(result.execResult.returnValue));
  };
  const events = (result: Awaited<ReturnType<typeof send>>) => (result.execResult.logs ?? []).map(([, topics, data]) => abi.parseLog({ topics: topics.map(bytesToHex), data: bytesToHex(data) }));
  return { owner, agent, stranger, ownerKey, agentKey, strangerKey, send, read, events };
}

test('deployed bytecode enforces agent authority, daily caps and daily reset', async () => {
  const vault = await localVault();
  const configured = await vault.send('configureAgentGuardrail', [vault.agent.toString(), 10000]);
  expect(configured.execResult.exceptionError).toBeUndefined();
  const paid = await vault.send('verifyAndRecordAgentSpend', [vault.owner.toString(), 'Bangkok electric bill', 1350, 'bill-450'], vault.agentKey);
  expect(paid.execResult.exceptionError).toBeUndefined();
  expect((await vault.read('userGuardrails', [vault.owner.toString()])).spentTodayUSD).toBe(1350n);
  const unauthorized = await vault.send('verifyAndRecordAgentSpend', [vault.owner.toString(), 'Shop', 100, 'not-authorized'], vault.strangerKey);
  expect(unauthorized.execResult.exceptionError?.error).toBe('revert');
  const overCap = await vault.send('verifyAndRecordAgentSpend', [vault.owner.toString(), 'Shop', 9000, 'over-cap'], vault.agentKey);
  expect(overCap.execResult.exceptionError?.error).toBe('revert');
  expect((await vault.read('userGuardrails', [vault.owner.toString()])).spentTodayUSD).toBe(1350n);
  const nextDay = await vault.send('verifyAndRecordAgentSpend', [vault.owner.toString(), 'Shop', 9000, 'new-day'], vault.agentKey, 1_700_086_401n);
  expect(nextDay.execResult.exceptionError).toBeUndefined();
  expect((await vault.read('userGuardrails', [vault.owner.toString()])).spentTodayUSD).toBe(9000n);
});

test('deployed bytecode emits exact four-way split and records gift metadata', async () => {
  const vault = await localVault();
  expect((await vault.send('configureIkigaiSplit', [50, 20, 15, 15])).execResult.exceptionError).toBeUndefined();
  const split = await vault.send('recordIkigaiIncomeSplit', [10500]);
  const event = vault.events(split).find((item) => item?.name === 'IncomeAutoSplitExecuted');
  expect([...event!.args].slice(1)).toEqual([10500n, 5250n, 2100n, 1575n, 1575n]);
  const invalid = await vault.send('configureIkigaiSplit', [50, 20, 15, 10]);
  expect(invalid.execResult.exceptionError?.error).toBe('revert');
  const note = 'U-topia with meaning. A gift for our family.';
  const gift = await vault.send('lockGenerationalGift', [vault.stranger.toString(), 'U-GOLD', 2500, note]);
  expect(gift.execResult.exceptionError).toBeUndefined();
  const stored = await vault.read('familyLegacyVaults', [vault.stranger.toString(), 0]);
  expect(stored.assetSymbol).toBe('U-GOLD'); expect(stored.amountUSD).toBe(2500n); expect(stored.familyBlessing).toBe(note);
});
