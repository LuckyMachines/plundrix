import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const implementation = (process.env.SEPOLIA_IMPLEMENTATION_ADDRESS
  || '0x26aDc1216BDa368a74d786148DcAB9baCA74dd7F').toLowerCase();
const rpcUrl = process.env.SEPOLIA_RPC_URL
  || process.env.VITE_RPC_URL
  || 'https://ethereum-sepolia-rpc.publicnode.com';
const artifactPath = resolve(process.env.PLUNDRIX_ARTIFACT
  || 'out/PlundrixGame.sol/PlundrixGame.json');
const blockscoutBaseUrl = process.env.BLOCKSCOUT_BASE_URL
  || 'https://eth-sepolia.blockscout.com';
const routescanApiUrl = process.env.ROUTESCAN_API_URL
  || 'https://api.routescan.io/v2/network/testnet/evm/11155111/etherscan/api';

function fail(message) {
  throw new Error(`Sepolia provenance check failed: ${message}`);
}

function normalizeHex(value) {
  return value.toLowerCase().replace(/^0x/, '');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));
const compiled = normalizeHex(artifact.deployedBytecode?.object || '');
if (!compiled) fail(`no deployed bytecode in ${artifactPath}`);

const response = await fetch(rpcUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getCode',
    params: [implementation, 'latest'],
  }),
});
if (!response.ok) fail(`RPC returned HTTP ${response.status}`);
const payload = await response.json();
if (payload.error) fail(`RPC error ${JSON.stringify(payload.error)}`);
const deployed = normalizeHex(payload.result || '');
if (!deployed) fail(`no code at ${implementation}`);
if (compiled.length !== deployed.length) {
  fail(`runtime length differs (compiled=${compiled.length / 2}, deployed=${deployed.length / 2} bytes)`);
}

const compiledChars = [...compiled];
const deployedChars = [...deployed];
const expectedImmutable = implementation.slice(2).padStart(64, '0');
const immutableRanges = Object.values(artifact.deployedBytecode.immutableReferences || {}).flat();

for (const { start, length } of immutableRanges) {
  const deployedValue = deployed.slice(start * 2, (start + length) * 2);
  if (length === 32 && deployedValue !== expectedImmutable) {
    fail(`unexpected immutable value at byte ${start}: 0x${deployedValue}`);
  }
  compiledChars.fill('0', start * 2, (start + length) * 2);
  deployedChars.fill('0', start * 2, (start + length) * 2);
}

const normalizedCompiled = compiledChars.join('');
const normalizedDeployed = deployedChars.join('');
if (normalizedCompiled !== normalizedDeployed) {
  let firstDifference = -1;
  for (let index = 0; index < normalizedCompiled.length; index += 2) {
    if (normalizedCompiled.slice(index, index + 2) !== normalizedDeployed.slice(index, index + 2)) {
      firstDifference = index / 2;
      break;
    }
  }
  fail(`runtime differs after immutable normalization at byte ${firstDifference}`);
}

const sourceResponse = await fetch(
  `${blockscoutBaseUrl}/api/v2/smart-contracts/${implementation}`,
);
if (!sourceResponse.ok) fail(`Blockscout source API returned HTTP ${sourceResponse.status}`);
const sourceRecord = await sourceResponse.json();
if (sourceRecord.is_verified !== true) {
  fail('Blockscout does not report the implementation source as verified');
}

const expectedCompiler = `v${artifact.metadata?.compiler?.version}`;
if (sourceRecord.name !== 'PlundrixGame') {
  fail(`unexpected Blockscout contract name: ${sourceRecord.name}`);
}
if (sourceRecord.compiler_version !== expectedCompiler) {
  fail(`Blockscout compiler differs (${sourceRecord.compiler_version} != ${expectedCompiler})`);
}
if (sourceRecord.optimization_enabled !== true || sourceRecord.optimization_runs !== 200) {
  fail(`unexpected Blockscout optimizer settings: enabled=${sourceRecord.optimization_enabled}, runs=${sourceRecord.optimization_runs}`);
}

const routescanResponse = await fetch(
  `${routescanApiUrl}?module=contract&action=getsourcecode&address=${implementation}`,
);
if (!routescanResponse.ok) fail(`Routescan source API returned HTTP ${routescanResponse.status}`);
const routescanPayload = await routescanResponse.json();
const routescanRecord = routescanPayload.result?.[0];
if (routescanPayload.status !== '1' || !routescanRecord) {
  fail('Routescan returned no verified source record');
}
if (routescanRecord.ContractName !== 'PlundrixGame'
  || routescanRecord.CompilerVersion !== expectedCompiler
  || routescanRecord.OptimizationUsed !== '1'
  || Number(routescanRecord.Runs) !== 200
  || routescanRecord.EVMVersion !== 'london') {
  fail('Routescan source settings do not match the compiled implementation');
}

console.log(JSON.stringify({
  status: 'verified',
  implementation,
  compiler: artifact.metadata?.compiler?.version,
  runtimeBytes: deployed.length / 2,
  immutableRanges,
  normalizedRuntimeSha256: sha256(normalizedDeployed),
  explorers: [
    {
      status: 'verified',
      provider: 'Blockscout',
      contractName: sourceRecord.name,
      compiler: sourceRecord.compiler_version,
      matchLevel: sourceRecord.is_fully_verified ? 'full' : 'partial',
      url: `${blockscoutBaseUrl}/address/${implementation}?tab=contract`,
    },
    {
      status: 'verified',
      provider: 'Routescan',
      contractName: routescanRecord.ContractName,
      compiler: routescanRecord.CompilerVersion,
      matchLevel: 'verified',
      url: `https://routescan.io/address/${implementation}?chainid=11155111`,
    },
  ],
}, null, 2));
