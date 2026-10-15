import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import solc from 'solc';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('contracts/UIkigaiVault.sol', root), 'utf8');
const specification = await readFile(new URL('docs/04_AVALANCHE_AND_CONTRACT.md', root), 'utf8');
const suppliedSource = specification.split('```solidity\n')[1]?.split('```')[0];
if (source.trim() !== suppliedSource?.trim()) throw new Error('The vault source differs from the exact supplied specification.');
const output = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity',
  sources: { 'UIkigaiVault.sol': { content: source } },
  settings: {
    evmVersion: 'cancun',
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
})));
const errors = (output.errors ?? []).filter((error) => error.severity === 'error');
if (errors.length) throw new Error(errors.map((error) => error.formattedMessage).join('\n'));
const contract = output.contracts['UIkigaiVault.sol'].UIkigaiVault;
const artifact = {
  contractName: 'UIkigaiVault',
  compilerVersion: solc.version(),
  evmVersion: 'cancun',
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
};
await mkdir(new URL('public/contracts/', root), { recursive: true });
await writeFile(new URL('public/contracts/UIkigaiVault.json', root), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Compiled exact UIkigaiVault source with ${artifact.compilerVersion} (EVM cancun).`);
