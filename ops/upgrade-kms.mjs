import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatEther, getAddress, parseEther } from 'viem';
import {
  createChainClient,
  deployContractWithKms,
  getEnv,
  getKmsAddress,
  getKmsKeyConfig,
  writeContractWithKms,
} from './kms-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifact = JSON.parse(readFileSync(
  resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'),
  'utf8',
));
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const MAX_RUNTIME_BYTES = 24_576;
const criticalPaths = [
  'contracts/PlundrixGame.sol',
  'foundry.toml',
  'foundry.lock',
  'lib/openzeppelin-contracts',
  'lib/openzeppelin-contracts-upgradeable',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function addressFromSlot(value) {
  const normalized = String(value || '').toLowerCase().replace(/^0x/, '');
  assert(normalized.length === 64, `Invalid EIP-1967 implementation slot value: ${value}`);
  return getAddress(`0x${normalized.slice(-40)}`);
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeState({ totalGames, paused, automation, workshop, fees }) {
  return {
    totalGames: totalGames.toString(),
    paused,
    automation: {
      enabled: automation[0],
      delaySeconds: automation[1].toString(),
      externalEntropyRequired: automation[2],
    },
    workshop,
    fees: {
      enabled: fees[0],
      basisPoints: fees[1].toString(),
      recipient: fees[2],
    },
  };
}

async function readProxyState(client, proxyAddress) {
  const [totalGames, paused, automation, workshop, fees] = await Promise.all([
    client.readContract({ address: proxyAddress, abi: artifact.abi, functionName: 'totalGames' }),
    client.readContract({ address: proxyAddress, abi: artifact.abi, functionName: 'paused' }),
    client.readContract({ address: proxyAddress, abi: artifact.abi, functionName: 'getAutomationSettings' }),
    client.readContract({ address: proxyAddress, abi: artifact.abi, functionName: 'workshop' }),
    client.readContract({ address: proxyAddress, abi: artifact.abi, functionName: 'getFeeSettings' }),
  ]);
  return normalizeState({ totalGames, paused, automation, workshop, fees });
}

const chainName = getEnv('CHAIN');
const normalizedChain = chainName.toLowerCase();
const isTestnet = ['sepolia', 'base-sepolia'].includes(normalizedChain);
if (!isTestnet && process.env.PLUNDRIX_ALLOW_PRODUCTION_UPGRADE !== 'true') {
  throw new Error('Production upgrade blocked. Use Sepolia, or set PLUNDRIX_ALLOW_PRODUCTION_UPGRADE=true after an approved production rehearsal.');
}
const rpcUrl = getEnv('RPC_URL');
const proxyAddress = getAddress(getEnv('PROXY_ADDRESS'));
const signerConfig = getKmsKeyConfig({ key: getEnv('GCP_KMS_KEY') });
const signerAddress = getKmsAddress(signerConfig);
const client = createChainClient({ chainName, rpcUrl });
const runtimeBytes = (artifact.deployedBytecode?.object?.length || 2) / 2 - 1;
assert(runtimeBytes > 0 && runtimeBytes <= MAX_RUNTIME_BYTES, `Runtime is ${runtimeBytes} bytes; EIP-170 limit is ${MAX_RUNTIME_BYTES}`);
const criticalStatus = git(['status', '--porcelain', '--', ...criticalPaths]);
if (criticalStatus && process.env.PLUNDRIX_ALLOW_DIRTY_DEPLOY !== 'true') {
  throw new Error(`Deployment-critical sources are uncommitted:\n${criticalStatus}`);
}
const sourceCommit = git(['rev-parse', 'HEAD']);
const sourceSha256 = sha256Hex(readFileSync(resolve(root, 'contracts', 'PlundrixGame.sol')));
const creationBytecodeSha256 = sha256Hex(artifact.bytecode.object);
const runtimeBytecodeSha256 = sha256Hex(artifact.deployedBytecode.object);

const [chainId, proxyCode, slotValue, upgraderRole, signerBalance, feeEstimate, beforeState] = await Promise.all([
  client.getChainId(),
  client.getCode({ address: proxyAddress }),
  client.getStorageAt({ address: proxyAddress, slot: IMPLEMENTATION_SLOT }),
  client.readContract({ address: proxyAddress, abi: artifact.abi, functionName: 'UPGRADER_ROLE' }),
  client.getBalance({ address: signerAddress }),
  client.estimateFeesPerGas(),
  readProxyState(client, proxyAddress),
]);
assert(chainId === client.chain.id, `RPC chain ${chainId} does not match configured ${client.chain.id}`);
assert(proxyCode && proxyCode !== '0x', `No proxy code at ${proxyAddress}`);
const previousImplementation = addressFromSlot(slotValue);
const previousCode = await client.getCode({ address: previousImplementation });
assert(previousCode && previousCode !== '0x', `No implementation code at ${previousImplementation}`);
const canUpgrade = await client.readContract({
  address: proxyAddress,
  abi: artifact.abi,
  functionName: 'hasRole',
  args: [upgraderRole, signerAddress],
});
assert(canUpgrade, `KMS signer ${signerAddress} does not have UPGRADER_ROLE`);

const deploymentGas = await client.estimateGas({
  account: signerAddress,
  data: artifact.bytecode.object,
});
const gasBufferBps = BigInt(process.env.KMS_GAS_BUFFER_BPS || '15000');
const projectedGas = ((deploymentGas * gasBufferBps + 9999n) / 10000n) + 300_000n;
const projectedCost = projectedGas * feeEstimate.maxFeePerGas;
const minimumReserve = parseEther(process.env.SEPOLIA_OPERATOR_RESERVE_ETH || '0.02');
assert(signerBalance > projectedCost + minimumReserve, `Upgrade would breach the ${formatEther(minimumReserve)} ETH signer reserve`);

console.log(JSON.stringify({
  mode: process.env.PLUNDRIX_ALLOW_UPGRADE === 'true' ? 'guarded-upgrade' : 'read-only-preflight',
  chain: normalizedChain,
  chainId,
  proxyAddress,
  previousImplementation,
  signerAddress,
  sourceCommit,
  sourceSha256,
  creationBytecodeSha256,
  runtimeBytecodeSha256,
  criticalSourceStatus: criticalStatus || 'clean',
  signerBalanceEth: formatEther(signerBalance),
  artifactRuntimeBytes: runtimeBytes,
  previousRuntimeBytes: (previousCode.length - 2) / 2,
  projectedMaxCostEth: formatEther(projectedCost),
  minimumReserveEth: formatEther(minimumReserve),
  preservedState: beforeState,
}, null, 2));

if (process.env.PLUNDRIX_ALLOW_UPGRADE !== 'true') {
  console.log('Upgrade preflight passed. Set PLUNDRIX_ALLOW_UPGRADE=true to deploy and upgrade.');
  process.exit(0);
}

const implementationHash = await deployContractWithKms({
  client,
  address: signerAddress,
  bytecode: artifact.bytecode.object,
  ...signerConfig,
});
const implementationReceipt = await client.waitForTransactionReceipt({ hash: implementationHash, confirmations: 1 });
assert(implementationReceipt.status === 'success', `Implementation deployment reverted: ${implementationHash}`);
assert(implementationReceipt.contractAddress, `Implementation receipt has no contract address: ${implementationHash}`);
const implementationAddress = getAddress(implementationReceipt.contractAddress);
const implementationCode = await client.getCode({ address: implementationAddress });
assert(implementationCode && implementationCode !== '0x', `No runtime code at new implementation ${implementationAddress}`);
assert((implementationCode.length - 2) / 2 === runtimeBytes, 'New implementation runtime length does not match the artifact');
const proxiableSlot = await client.readContract({
  address: implementationAddress,
  abi: artifact.abi,
  functionName: 'proxiableUUID',
});
assert(proxiableSlot.toLowerCase() === IMPLEMENTATION_SLOT, 'New implementation reports an unexpected proxiable UUID');

const slotBeforeUpgrade = addressFromSlot(await client.getStorageAt({ address: proxyAddress, slot: IMPLEMENTATION_SLOT }));
assert(slotBeforeUpgrade === previousImplementation, `Proxy implementation changed during deployment (${slotBeforeUpgrade})`);
await client.simulateContract({
  account: signerAddress,
  address: proxyAddress,
  abi: artifact.abi,
  functionName: 'upgradeTo',
  args: [implementationAddress],
});

const upgradeHash = await writeContractWithKms({
  client,
  address: signerAddress,
  contractAddress: proxyAddress,
  abi: artifact.abi,
  functionName: 'upgradeTo',
  args: [implementationAddress],
  ...signerConfig,
});
const upgradeReceipt = await client.waitForTransactionReceipt({ hash: upgradeHash, confirmations: 1 });
assert(upgradeReceipt.status === 'success', `Proxy upgrade reverted: ${upgradeHash}`);

const currentImplementation = addressFromSlot(await client.getStorageAt({ address: proxyAddress, slot: IMPLEMENTATION_SLOT }));
assert(currentImplementation === implementationAddress, `Proxy slot points to ${currentImplementation}, expected ${implementationAddress}`);
const afterState = await readProxyState(client, proxyAddress);
assert(JSON.stringify(afterState) === JSON.stringify(beforeState), 'Proxy state changed unexpectedly during upgrade');

const signerBalanceAfter = await client.getBalance({ address: signerAddress });
const report = {
  verifiedAt: new Date().toISOString(),
  network: normalizedChain,
  chainId,
  proxyAddress,
  previousImplementation,
  implementationAddress,
  artifactRuntimeBytes: runtimeBytes,
  signerAddress,
  sourceCommit,
  sourceSha256,
  creationBytecodeSha256,
  runtimeBytecodeSha256,
  balances: {
    beforeEth: formatEther(signerBalance),
    afterEth: formatEther(signerBalanceAfter),
  },
  transactions: {
    implementation: { hash: implementationHash, blockNumber: implementationReceipt.blockNumber.toString() },
    upgrade: { hash: upgradeHash, blockNumber: upgradeReceipt.blockNumber.toString() },
  },
  preservedState: afterState,
  rollbackImplementation: previousImplementation,
};
const reportPath = resolve(root, 'reports', `${normalizedChain}-upgrade`, 'latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`implementationTx=${implementationHash}`);
console.log(`implementation=${implementationAddress}`);
console.log(`upgradeTx=${upgradeHash}`);
console.log(`Upgrade and state-preservation checks passed. Report: ${reportPath}`);
