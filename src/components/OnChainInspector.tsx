'use client';

import { useEffect, useState } from 'react';
import { connectFujiVault, deployFujiVault, sendFujiRecord, type FujiAction, type FujiSession } from '@/lib/fuji';

export function OnChainInspector() {
  const [address, setAddress] = useState(process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? '');
  const [beneficiary, setBeneficiary] = useState('');
  const [session, setSession] = useState<FujiSession | null>(null);
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('Enter the address of the supplied contract deployed on Fuji.');
  const [hash, setHash] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_VAULT_ADDRESS) return;
    try { setAddress(window.localStorage.getItem('u-ikigai-fuji-vault') || ''); } catch { /* Manual entry works if browser storage is unavailable. */ }
  }, []);
  const rememberAddress = (value: string) => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('u-ikigai-fuji-vault', value); } catch { /* The displayed address can still be copied. */ }
    }
  };
  const handleError = (error: unknown) => { const detail = error as { shortMessage?: string; message?: string }; setStatus(detail.shortMessage || detail.message || 'The wallet request could not complete.'); };
  const connect = async () => {
    setBusy('connect'); setHash('');
    try { const connected = await connectFujiVault(address); setSession(connected); rememberAddress(connected.address); setBeneficiary(connected.account); setStatus('Vault verified on Fuji. Each write below asks your own wallet to sign a testnet transaction.'); }
    catch (error) { setSession(null); handleError(error); } finally { setBusy(''); }
  };
  const deploy = async () => {
    setBusy('deploy'); setHash(''); setSession(null); setStatus('Review the Fuji contract deployment in your own wallet.');
    try {
      const receipt = await deployFujiVault((submitted) => { setHash(submitted); setStatus('Deployment submitted. Waiting for confirmation…'); });
      setAddress(receipt.address); rememberAddress(receipt.address);
      setStatus(`Vault deployed at ${receipt.address} in block ${receipt.blockNumber}. Use Connect & verify to inspect it.`);
    } catch (error) { handleError(error); } finally { setBusy(''); }
  };
  const record = async (action: FujiAction) => {
    if (!session) return;
    setBusy(action); setHash(''); setStatus('Review the transaction in your wallet.');
    try { const receipt = await sendFujiRecord(session, action, beneficiary, (submitted) => { setHash(submitted); setStatus('Submitted to Fuji. Waiting for one block confirmation…'); }); setStatus(`Confirmed on Fuji in block ${receipt.blockNumber}.`); }
    catch (error) { handleError(error); } finally { setBusy(''); }
  };
  return <section className="onchain-inspector"><h3>Optional live Fuji contract inspector</h3><p>Writes records to the supplied contract using your browser wallet and test AVAX. It does not transfer tokens, pay a real merchant, or change the demo ledger.</p><div className="deployment-tools"><h4>Deploy the supplied vault</h4><p>The exact specified source is compiled for Avalanche-compatible Cancun execution. Your own wallet reviews and signs deployment; the application never asks for a private key.</p><button className="secondary-action" disabled={Boolean(busy)} onClick={deploy}>{busy === 'deploy' ? 'Waiting for deployment…' : 'Deploy vault on Fuji with my wallet'}</button><a href="/contracts/UIkigaiVault.json" download>Download compiled ABI & bytecode</a></div><label htmlFor="vault-address">DEPLOYED VAULT ADDRESS</label><input id="vault-address" value={address} autoComplete="off" spellCheck={false} onChange={(event) => { setAddress(event.target.value); setSession(null); }} /><button className="secondary-action" disabled={Boolean(busy) || !address.trim()} onClick={connect}>{busy === 'connect' ? 'Connecting…' : 'Connect & verify Fuji vault'}</button>
    {session && <><p className="wallet-account">Signer: <code>{session.account}</code><br />All USD values below are recorded in cents.</p><div className="inspector-actions">{([
      ['guardrail', '1. Configure $100 daily cap'], ['split', '2. Configure 50 / 20 / 15 / 15 split'], ['spend', '3. Record $13.50 bill spend'], ['income', '4. Record $105 income split'],
    ] as [FujiAction, string][]).map(([action, label]) => <button key={action} className="secondary-action" disabled={Boolean(busy)} onClick={() => record(action)}>{busy === action ? 'Waiting for wallet…' : label}</button>)}</div><label htmlFor="gift-beneficiary">GIFT BENEFICIARY ADDRESS</label><input id="gift-beneficiary" value={beneficiary} autoComplete="off" spellCheck={false} onChange={(event) => setBeneficiary(event.target.value)} /><button className="secondary-action" disabled={Boolean(busy)} onClick={() => record('gift')}>Record $25 gold gift metadata</button></>}
    <p className="inspector-status" role="status">{status}</p>{hash && <a href={`https://testnet.snowtrace.io/tx/${hash}`} target="_blank" rel="noreferrer">Inspect real Fuji receipt ↗<code>{hash}</code></a>}
  </section>;
}
