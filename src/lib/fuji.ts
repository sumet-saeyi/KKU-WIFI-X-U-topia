import { BrowserProvider, Contract, ContractFactory, isAddress, type Eip1193Provider, type InterfaceAbi } from 'ethers';

export const FUJI_CHAIN_ID = 43113;
export const vaultAbi = [
  'function userGuardrails(address) view returns (address agentSigner,uint256 dailySpendCapUSD,uint256 spentTodayUSD,uint256 lastResetTimestamp,bool active)',
  'function configureAgentGuardrail(address,uint256)',
  'function configureIkigaiSplit(uint8,uint8,uint8,uint8)',
  'function verifyAndRecordAgentSpend(address,string,uint256,string) returns (bool)',
  'function recordIkigaiIncomeSplit(uint256)',
  'function lockGenerationalGift(address,string,uint256,string)',
];
declare global { interface Window { ethereum?: Eip1193Provider; } }

export async function connectFujiWallet() {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('Open this view in a browser with an Ethereum-compatible wallet.');
  const injected = window.ethereum;
  await injected.request({ method: 'eth_requestAccounts' });
  if (Number(await injected.request({ method: 'eth_chainId' })) !== FUJI_CHAIN_ID) {
    try {
      await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa869' }] });
    } catch (error) {
      if ((error as { code?: number }).code !== 4902) throw error;
      await injected.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0xa869', chainName: 'Avalanche Fuji C-Chain', nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'], blockExplorerUrls: ['https://testnet.snowtrace.io'] }] });
      await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa869' }] });
    }
  }
  if (Number(await injected.request({ method: 'eth_chainId' })) !== FUJI_CHAIN_ID) throw new Error('Select Avalanche Fuji (43113) to continue.');
  const provider = new BrowserProvider(injected);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();
  return { provider, signer, account, injected };
}

export async function connectFujiVault(address: string) {
  if (!isAddress(address)) throw new Error('Enter a valid deployed vault address.');
  const { provider, signer, account, injected } = await connectFujiWallet();
  const code = await provider.getCode(address);
  if (code === '0x') throw new Error('There is no contract at this address on Fuji.');
  const contract = new Contract(address, vaultAbi, signer);
  await contract.userGuardrails(account);
  return { account, address, provider, contract, injected };
}

interface VaultArtifact { contractName: string; abi: InterfaceAbi; bytecode: string; sourceSha256: string; }

export async function deployFujiVault(onSubmitted: (hash: string) => void) {
  if (typeof window === 'undefined') throw new Error('Deploy from a browser wallet.');
  const response = await fetch('/contracts/UIkigaiVault.json');
  if (!response.ok) throw new Error('The deployment artifact is unavailable. Run npm run contract:build.');
  const artifact = await response.json() as VaultArtifact;
  if (artifact.contractName !== 'UIkigaiVault' || !Array.isArray(artifact.abi) || !/^0x[0-9a-f]+$/i.test(artifact.bytecode) || !/^[0-9a-f]{64}$/i.test(artifact.sourceSha256)) throw new Error('The vault deployment artifact is invalid.');
  const { signer, injected, account } = await connectFujiWallet();
  // Revalidate immediately before deployment, just as for subsequent record writes.
  if (Number(await injected.request({ method: 'eth_chainId' })) !== FUJI_CHAIN_ID) throw new Error('The wallet network changed. Connect Fuji again.');
  const accounts = await injected.request({ method: 'eth_accounts' }) as string[];
  if (accounts[0]?.toLowerCase() !== account.toLowerCase()) throw new Error('The wallet account changed. Connect again.');
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  const transaction = contract.deploymentTransaction();
  if (!transaction) throw new Error('The wallet did not submit a deployment transaction.');
  onSubmitted(transaction.hash);
  const receipt = await transaction.wait(1, 60000);
  if (!receipt || receipt.status !== 1 || !receipt.contractAddress) throw new Error('The vault deployment was not confirmed. Check the transaction receipt.');
  return { address: receipt.contractAddress, hash: transaction.hash, blockNumber: receipt.blockNumber };
}

export type FujiSession = Awaited<ReturnType<typeof connectFujiVault>>;
export type FujiAction = 'guardrail' | 'split' | 'spend' | 'income' | 'gift';

export function recordCall(action: FujiAction, account: string, beneficiary: string) {
  // The exact supplied contract uses uint USD fields; this integration stores USD cents.
  switch (action) {
    case 'guardrail': return { method: 'configureAgentGuardrail', args: [account, 10000] };
    case 'split': return { method: 'configureIkigaiSplit', args: [50, 20, 15, 15] };
    case 'spend': return { method: 'verifyAndRecordAgentSpend', args: [account, 'Bangkok electric bill', 1350, 'u-ikigai-bill-450-thb'] };
    case 'income': return { method: 'recordIkigaiIncomeSplit', args: [10500] };
    case 'gift':
      if (!isAddress(beneficiary)) throw new Error('Enter a valid beneficiary address.');
      return { method: 'lockGenerationalGift', args: [beneficiary, 'U-GOLD', 2500, 'U-topia with meaning.'] };
  }
}

export async function sendFujiRecord(session: FujiSession, action: FujiAction, beneficiary: string, onSubmitted: (hash: string) => void) {
  const chain = Number(await session.injected.request({ method: 'eth_chainId' }));
  const accounts = await session.injected.request({ method: 'eth_accounts' }) as string[];
  if (chain !== FUJI_CHAIN_ID || accounts[0]?.toLowerCase() !== session.account.toLowerCase()) throw new Error('Wallet account or network changed. Connect the vault again.');
  const { method, args } = recordCall(action, session.account, beneficiary);
  const transaction = await session.contract[method](...args);
  onSubmitted(transaction.hash);
  const receipt = await transaction.wait(1, 60000);
  if (!receipt || receipt.status !== 1) throw new Error('Transaction was not confirmed successfully. Check its explorer receipt.');
  return { hash: transaction.hash as string, blockNumber: receipt.blockNumber as number };
}
