import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { encodeFunctionData } from 'viem';
import {
  createChainClient,
  deployContractWithKms,
  getEnv,
  getKmsAddress,
  getKmsKeyConfig,
  writeContractWithKms,
} from './kms-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const gameArtifact = JSON.parse(readFileSync(resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'), 'utf8'));
const workshopArtifact = JSON.parse(readFileSync(resolve(root, 'out/PlundrixWorkshop.sol/PlundrixWorkshop.json'), 'utf8'));
const proxyArtifact = JSON.parse(readFileSync(resolve(root, 'out/ERC1967Proxy.sol/ERC1967Proxy.json'), 'utf8'));

const chainName = getEnv('CHAIN');
if (!['sepolia', 'base-sepolia'].includes(chainName.toLowerCase())) {
  throw new Error('Workshop bootstrap is testnet-only; set CHAIN=sepolia or CHAIN=base-sepolia');
}

const rpcUrl = getEnv('RPC_URL');
const gameAddress = getEnv('PLUNDRIX_ADDRESS');
const signerConfig = getKmsKeyConfig({ key: getEnv('GCP_KMS_KEY') });
const signerAddress = getKmsAddress(signerConfig);
const defaultAdmin = getEnv('DEFAULT_ADMIN_ADDRESS', signerAddress);
const upgrader = getEnv('UPGRADER_ADDRESS', defaultAdmin);
const client = createChainClient({ chainName, rpcUrl });

const gameMasterRole = await client.readContract({ address: gameAddress, abi: gameArtifact.abi, functionName: 'GAME_MASTER_ROLE' });
const canConfigure = await client.readContract({ address: gameAddress, abi: gameArtifact.abi, functionName: 'hasRole', args: [gameMasterRole, signerAddress] });
if (!canConfigure) throw new Error(`KMS signer ${signerAddress} does not have GAME_MASTER_ROLE`);

const configuredWorkshop = await client.readContract({ address: gameAddress, abi: gameArtifact.abi, functionName: 'workshop' });
if (configuredWorkshop !== '0x0000000000000000000000000000000000000000') {
  throw new Error(`Game already has workshop ${configuredWorkshop}; use upgrade:workshop:kms instead`);
}

console.log(`chain=${chainName}`);
console.log(`signer=${signerAddress}`);
console.log(`game=${gameAddress}`);

const implementationHash = await deployContractWithKms({
  client,
  address: signerAddress,
  bytecode: workshopArtifact.bytecode.object,
  ...signerConfig,
});
const implementationReceipt = await client.waitForTransactionReceipt({ hash: implementationHash });
if (implementationReceipt.status !== 'success') throw new Error('Workshop implementation deployment reverted');
const implementationAddress = implementationReceipt.contractAddress;

const proxyHash = await deployContractWithKms({
  client,
  address: signerAddress,
  bytecode: proxyArtifact.bytecode.object,
  constructorTypes: 'address, bytes',
  constructorArgs: [
    implementationAddress,
    encodeFunctionData({
      abi: workshopArtifact.abi,
      functionName: 'initialize',
      args: [gameAddress, defaultAdmin, upgrader],
    }),
  ],
  ...signerConfig,
});
const proxyReceipt = await client.waitForTransactionReceipt({ hash: proxyHash });
if (proxyReceipt.status !== 'success') throw new Error('Workshop proxy deployment reverted');
const workshopAddress = proxyReceipt.contractAddress;

const configureHash = await writeContractWithKms({
  client,
  address: signerAddress,
  contractAddress: gameAddress,
  abi: gameArtifact.abi,
  functionName: 'configureWorkshop',
  args: [workshopAddress],
  ...signerConfig,
});
const configureReceipt = await client.waitForTransactionReceipt({ hash: configureHash });
if (configureReceipt.status !== 'success') throw new Error('Workshop configuration reverted');

const linkedWorkshop = await client.readContract({ address: gameAddress, abi: gameArtifact.abi, functionName: 'workshop' });
const linkedGame = await client.readContract({ address: workshopAddress, abi: workshopArtifact.abi, functionName: 'game' });
if (linkedWorkshop.toLowerCase() !== workshopAddress.toLowerCase() || linkedGame.toLowerCase() !== gameAddress.toLowerCase()) {
  throw new Error('Post-deploy workshop linkage verification failed');
}

console.log(`workshopImplementationTx=${implementationHash}`);
console.log(`workshopImplementation=${implementationAddress}`);
console.log(`workshopProxyTx=${proxyHash}`);
console.log(`workshopProxy=${workshopAddress}`);
console.log(`configureWorkshopTx=${configureHash}`);
console.log('Workshop deployment and bidirectional linkage verified.');
