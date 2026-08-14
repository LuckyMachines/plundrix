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

console.log(JSON.stringify({
  status: 'verified',
  implementation,
  compiler: artifact.metadata?.compiler?.version,
  runtimeBytes: deployed.length / 2,
  immutableRanges,
  normalizedRuntimeSha256: sha256(normalizedDeployed),
}, null, 2));
