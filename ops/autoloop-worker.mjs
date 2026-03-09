import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAddress, keccak256, toHex } from 'viem';
import {
  createChainClient,
  getEnv,
  getKmsAddress,
  getKmsKeyConfig,
  writeContractWithKms,
} from './kms-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const artifact = JSON.parse(
  readFileSync(resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'), 'utf8')
);

const chainName = getEnv('CHAIN', 'mainnet');
const rpcUrl = getEnv('RPC_URL');
const contractAddress = getAddress(getEnv('CONTRACT_ADDRESS'));
const pollMs = Number(getEnv('POLL_MS', '15000'));
const entropySourceUrl = getEnv(
  'ENTROPY_SOURCE_URL',
  'https://api.drand.sh/public/latest'
);
const signerConfig = getKmsKeyConfig({
  key: getEnv('GCP_KMS_KEY'),
});
const signerAddress = getKmsAddress(signerConfig);
const client = createChainClient({ chainName, rpcUrl });

async function fetchEntropy(gameId, round) {
  const response = await fetch(entropySourceUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(
      `Entropy source failed: ${response.status} ${await response.text()}`
    );
  }
  const payload = await response.json();
  if (!payload.randomness) {
    throw new Error('Entropy source did not return randomness');
  }
  return BigInt(
    keccak256(
      toHex(`${payload.randomness}:${payload.round ?? '0'}:${gameId}:${round}`)
    )
  );
}

async function readContract(functionName, args = []) {
  return client.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName,
    args,
  });
}

async function provideEntropy(gameId, round) {
  const entropy = await fetchEntropy(gameId, round);
  const hash = await writeContractWithKms({
    client,
    address: signerAddress,
    contractAddress,
    abi: artifact.abi,
    functionName: 'provideRoundEntropy',
    args: [gameId, round, entropy],
    ...signerConfig,
  });
  console.log(
    `[entropy] game=${gameId} round=${round} entropy=${entropy} tx=${hash}`
  );
  await client.waitForTransactionReceipt({ hash });
}

async function resolveRound(gameId) {
  const hash = await writeContractWithKms({
    client,
    address: signerAddress,
    contractAddress,
    abi: artifact.abi,
    functionName: 'resolveRound',
    args: [gameId],
    ...signerConfig,
  });
  console.log(`[resolve] game=${gameId} tx=${hash}`);
  await client.waitForTransactionReceipt({ hash });
}

async function resolveTimedOutGames(gameIds) {
  const hash = await writeContractWithKms({
    client,
    address: signerAddress,
    contractAddress,
    abi: artifact.abi,
    functionName: 'resolveTimedOutGames',
    args: [gameIds],
    ...signerConfig,
  });
  console.log(`[autoresolve] games=${gameIds.join(',')} tx=${hash}`);
  await client.waitForTransactionReceipt({ hash });
}

async function tick() {
  const [totalGames, settings] = await Promise.all([
    readContract('totalGames'),
    readContract('getAutomationSettings'),
  ]);
  const [autoResolveEnabled, autoResolveDelay, requireExternalEntropy] = settings;
  if (!autoResolveEnabled) {
    console.log('[tick] auto resolve disabled');
    return;
  }

  const timedOutIds = [];

  for (let gameId = 1n; gameId <= totalGames; gameId++) {
    const [state, currentRound, , roundStartTime] = await readContract(
      'getGameInfo',
      [gameId]
    );
    if (state !== 1) {
      continue;
    }

    const allSubmitted = await readContract('allActionsSubmitted', [gameId]);
    const roundEntropy = requireExternalEntropy
      ? await readContract('getRoundEntropy', [gameId, currentRound])
      : 0n;
    const deadline = roundStartTime + autoResolveDelay;
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (requireExternalEntropy && roundEntropy === 0n && (allSubmitted || now >= deadline)) {
      await provideEntropy(gameId, currentRound);
    }

    if (allSubmitted) {
      await resolveRound(gameId);
      continue;
    }

    const canAutoResolve = await readContract('canAutoResolve', [gameId]);
    if (canAutoResolve) {
      timedOutIds.push(gameId);
    }
  }

  if (timedOutIds.length > 0) {
    await resolveTimedOutGames(timedOutIds);
  } else {
    console.log('[tick] no eligible timed-out games');
  }
}

console.log(`chain=${chainName}`);
console.log(`signer=${signerAddress}`);
console.log(`contract=${contractAddress}`);
console.log(`pollMs=${pollMs}`);

while (true) {
  try {
    await tick();
  } catch (error) {
    console.error('[tick:error]', error);
  }

  await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
}
