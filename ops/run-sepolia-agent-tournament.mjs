import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatEther,
  createPublicClient,
  encodeFunctionData,
  fallback,
  getAddress,
  http,
  keccak256,
  parseEther,
  toHex,
  zeroAddress,
} from 'viem';
import { sepolia } from 'viem/chains';
import {
  getKmsKeyConfig,
  prepareTransaction,
  sendTransactionWithKms,
  signTransactionWithKms,
  writeContractWithKms,
} from './kms-lib.mjs';
import {
  TOURNAMENT_AGENTS,
  buildTournamentSchedule,
  chooseAgentAction,
  renderTournamentMarkdown,
} from './sepolia-agent-tournament-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifact = JSON.parse(readFileSync(resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'), 'utf8'));
const runId = process.env.TOURNAMENT_RUN_ID || 'phase-1';
const strategyVersion = process.env.TOURNAMENT_STRATEGY_VERSION || 'baseline-v1';
assertSafeIdentifier(runId, 'TOURNAMENT_RUN_ID');
assertSafeIdentifier(strategyVersion, 'TOURNAMENT_STRATEGY_VERSION');
const reportDir = resolve(root, 'reports/sepolia-agent-tournament', runId);
const statePath = resolve(reportDir, 'state.json');
const markdownPath = resolve(reportDir, 'report.md');
const configuredRpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
const rpcUrls = configuredRpcUrl
  ? [configuredRpcUrl, 'https://sepolia.gateway.tenderly.co']
  : ['https://sepolia.gateway.tenderly.co'];
const contractAddress = getAddress(process.env.SEPOLIA_CONTRACT_ADDRESS || '0x1FF715D46470B4024D88A12838e08A60855f0AE2');
const operatorAddress = getAddress(process.env.SEPOLIA_OPERATOR_ADDRESS || '0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79');
const opponentAddress = getAddress(process.env.SEPOLIA_OPPONENT_ADDRESS || '0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f');
const operatorConfig = getKmsKeyConfig({ key: process.env.SEPOLIA_OPERATOR_KMS_KEY || 'autoloop-deployer' });
const opponentConfig = getKmsKeyConfig({ key: process.env.SEPOLIA_OPPONENT_KMS_KEY || 'plundrix-deployer' });
const allowWrites = process.env.PLUNDRIX_ALLOW_SEPOLIA_TOURNAMENT_WRITES === 'true';
const targetGames = Number(process.env.TOURNAMENT_TARGET_GAMES || '50');
const maxRounds = Number(process.env.TOURNAMENT_MAX_ROUNDS || '30');
const roundPaceMs = Number(process.env.TOURNAMENT_ROUND_PACE_MS || '5000');
const stopAfterCompleted = Number(process.env.TOURNAMENT_STOP_AFTER_COMPLETED || '0');
const operatorReserve = parseEther(process.env.SEPOLIA_OPERATOR_RESERVE_ETH || '0.02');
const operatorGasPerGame = BigInt(process.env.TOURNAMENT_OPERATOR_GAS_PER_GAME || '3000000');
const opponentGasPerGame = BigInt(process.env.TOURNAMENT_OPPONENT_GAS_PER_GAME || '900000');
const feeSafetyBps = BigInt(process.env.TOURNAMENT_FEE_SAFETY_BPS || '12500');
const client = createPublicClient({
  chain: sepolia,
  transport: fallback(rpcUrls.map((url) => http(url, {
    timeout: 12_000,
    retryCount: 5,
    retryDelay: 2_000,
  }))),
});
const schedule = buildTournamentSchedule(5).slice(0, targetGames);
const operator = { address: operatorAddress, config: operatorConfig };
const opponent = { address: opponentAddress, config: opponentConfig };
const gasCeilings = Object.freeze({
  createGame: 250_000n,
  registerPlayer: 200_000n,
  startGame: 200_000n,
  submitAction: 180_000n,
  provideRoundEntropy: 180_000n,
  resolveRound: 400_000n,
});
let feeQuotePromise;
let feeQuoteExpiresAt = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSafeIdentifier(value, label) {
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(value)) {
    throw new Error(`${label} must use lowercase letters, numbers, and hyphens only`);
  }
}

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, content, 'utf8');
  renameSync(temporaryPath, path);
}

function loadReport() {
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

function saveReport(report) {
  report.updatedAt = new Date().toISOString();
  atomicWrite(statePath, `${JSON.stringify(report, null, 2)}\n`);
  atomicWrite(markdownPath, renderTournamentMarkdown(report));
}

async function read(functionName, args = []) {
  return client.readContract({ address: contractAddress, abi: artifact.abi, functionName, args });
}

async function waitForRead(predicate, label, attempts = 10) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await predicate()) return;
    if (attempt < attempts) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1500));
    }
  }
  throw new Error(`Timed out waiting for consistent onchain state: ${label}`);
}

async function waitForPendingTransactions() {
  let stableChecks = 0;
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    const [operatorLatest, operatorPending, opponentLatest, opponentPending] = await Promise.all([
      client.getTransactionCount({ address: operatorAddress, blockTag: 'latest' }),
      client.getTransactionCount({ address: operatorAddress, blockTag: 'pending' }),
      client.getTransactionCount({ address: opponentAddress, blockTag: 'latest' }),
      client.getTransactionCount({ address: opponentAddress, blockTag: 'pending' }),
    ]);
    if (operatorLatest === operatorPending && opponentLatest === opponentPending) {
      stableChecks += 1;
      if (stableChecks >= 3) return;
    } else {
      stableChecks = 0;
      console.log(`[resume] waiting for pending transactions: operator=${operatorLatest}/${operatorPending} opponent=${opponentLatest}/${opponentPending}`);
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000));
  }
  throw new Error('Timed out waiting for previously broadcast transactions to settle');
}

async function waitForSuccess(hash, label) {
  const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 1 });
  assert(receipt.status === 'success', `${label} reverted: ${hash}`);
  return receipt;
}

async function currentFeeQuote() {
  if (!feeQuotePromise || Date.now() >= feeQuoteExpiresAt) {
    feeQuotePromise = client.estimateFeesPerGas().then((quote) => ({
      maxFeePerGas: (quote.maxFeePerGas * 12500n + 9999n) / 10000n,
      maxPriorityFeePerGas: quote.maxPriorityFeePerGas,
    }));
    feeQuoteExpiresAt = Date.now() + 45_000;
  }
  return feeQuotePromise;
}

async function prepareSignedWrite(signer, functionName, args, nonce, feeQuote) {
  const transaction = await prepareTransaction({
    client,
    address: signer.address,
    to: contractAddress,
    data: encodeFunctionData({ abi: artifact.abi, functionName, args }),
    gas: gasCeilings[functionName],
    nonce,
    ...feeQuote,
  });
  return signTransactionWithKms({
    transaction,
    address: signer.address,
    ...signer.config,
  });
}

async function sendRawWithBackoff(serializedTransaction, label, signer) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await client.sendRawTransaction({ serializedTransaction });
    } catch (error) {
      const rateLimited = error.status === 429
        || String(error.details || error.message).toLowerCase().includes('rate limit');
      if (!rateLimited || attempt === 6) throw error;
      const backoffMs = (12_000 * attempt) + (signer.address === opponentAddress ? 3_000 : 0);
      console.log(`[rpc] rate limited during ${label}; retrying in ${backoffMs}ms`);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, backoffMs));
    }
  }
  throw new Error(`${label} did not produce a transaction hash`);
}

async function write(signer, functionName, args = []) {
  let hash;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const feeQuote = await currentFeeQuote();
      hash = await writeContractWithKms({
        client,
        address: signer.address,
        contractAddress,
        abi: artifact.abi,
        functionName,
        args,
        gas: gasCeilings[functionName],
        ...feeQuote,
        ...signer.config,
      });
      break;
    } catch (error) {
      const rateLimited = error.status === 429
        || String(error.details || error.message).toLowerCase().includes('rate limit');
      if (!rateLimited || attempt === 6) throw error;
      const backoffMs = (12_000 * attempt) + (signer.address === opponentAddress ? 3_000 : 0);
      console.log(`[rpc] rate limited during ${functionName}; retrying in ${backoffMs}ms`);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, backoffMs));
    }
  }
  assert(hash, `${functionName} did not produce a transaction hash`);
  const receipt = await waitForSuccess(hash, functionName);
  console.log(`[tx] ${functionName}=${hash}`);
  return {
    hash,
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    costWei: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
  };
}

async function fundOpponent(value) {
  const hash = await sendTransactionWithKms({
    client,
    address: operator.address,
    to: opponent.address,
    value,
    ...operator.config,
  });
  const receipt = await waitForSuccess(hash, 'fund opponent');
  return {
    label: 'fundOpponent',
    hash,
    valueWei: value.toString(),
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    costWei: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
  };
}

async function fetchEntropy(gameId, round) {
  const endpoints = [
    'https://api.drand.sh/public/latest',
    'https://api2.drand.sh/public/latest',
    'https://api3.drand.sh/public/latest',
  ];
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
        assert(response.ok, `drand returned HTTP ${response.status} from ${endpoint}`);
        const payload = await response.json();
        assert(payload.randomness, `drand returned no randomness from ${endpoint}`);
        return BigInt(keccak256(toHex(`${payload.randomness}:${payload.round}:${gameId}:${round}`)));
      } catch (error) {
        lastError = error;
        console.warn(`[drand] ${endpoint} attempt ${attempt} failed: ${error.message}`);
      }
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 1_000));
  }
  throw new Error(`Unable to fetch drand entropy after ${endpoints.length * 2} attempts`, {
    cause: lastError,
  });
}

function playerState(raw) {
  return {
    locks: Number(raw[0]),
    tools: Number(raw[1]),
    stunned: Boolean(raw[2]),
    registered: Boolean(raw[3]),
    actionSubmitted: Boolean(raw[4]),
  };
}

function createReport(totalGamesBefore, balances) {
  return {
    schemaVersion: 1,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'running',
    runId,
    strategyVersion,
    chainId: 11155111,
    contractAddress,
    targetGames,
    maxRounds,
    totalGamesBefore: totalGamesBefore.toString(),
    wallets: { seatA: operatorAddress, seatB: opponentAddress },
    agents: TOURNAMENT_AGENTS,
    schedule,
    startingBalances: balances,
    fundingTransactions: [],
    games: [],
  };
}

assert(Number.isInteger(targetGames) && targetGames === 50, 'TOURNAMENT_TARGET_GAMES must be exactly 50 for the published tournament');
assert(Number.isInteger(maxRounds) && maxRounds >= 15 && maxRounds <= 50, 'TOURNAMENT_MAX_ROUNDS must be 15-50');
assert(feeSafetyBps >= 10000n && feeSafetyBps <= 30000n, 'TOURNAMENT_FEE_SAFETY_BPS must be 10000-30000');

const requiredRoles = ['DEFAULT_ADMIN_ROLE', 'GAME_MASTER_ROLE', 'RANDOMIZER_ROLE'];
for (const roleName of requiredRoles) {
  const role = await read(roleName);
  assert(await read('hasRole', [role, operatorAddress]), `${operatorAddress} is missing ${roleName}`);
}

const [paused, automation, totalGamesBefore, operatorBalance, opponentBalance, fees] = await Promise.all([
  read('paused'),
  read('getAutomationSettings'),
  read('totalGames'),
  client.getBalance({ address: operatorAddress }),
  client.getBalance({ address: opponentAddress }),
  client.estimateFeesPerGas(),
]);
assert(!paused, 'Sepolia contract is paused');
assert(automation[2] === true, 'Sepolia must require external entropy');

const existing = loadReport();
if (existing) {
  assert(existing.chainId === 11155111 && getAddress(existing.contractAddress) === contractAddress, 'Existing report targets another deployment');
  assert(existing.targetGames === targetGames, 'Existing report has a different target game count');
  assert(existing.runId === runId && existing.strategyVersion === strategyVersion, 'Existing report belongs to another run or strategy version');
}
const completedGames = existing?.games.filter(({ status }) => status === 'complete').length || 0;
const remainingGames = targetGames - completedGames;
const budgetFeePerGas = (fees.maxFeePerGas * feeSafetyBps + 9999n) / 10000n;
const requiredOpponent = BigInt(remainingGames) * opponentGasPerGame * budgetFeePerGas;
const opponentFundingNeeded = opponentBalance < requiredOpponent ? requiredOpponent - opponentBalance : 0n;
const opponentFundingGas = opponentFundingNeeded > 0n ? 50_000n * budgetFeePerGas : 0n;
const requiredOperatorAfterFunding = operatorReserve
  + (BigInt(remainingGames) * operatorGasPerGame * budgetFeePerGas)
  + opponentFundingGas;
const totalOperatorRequired = requiredOperatorAfterFunding + opponentFundingNeeded;
const operatorFundingGap = operatorBalance < totalOperatorRequired ? totalOperatorRequired - operatorBalance : 0n;

console.log(JSON.stringify({
  mode: allowWrites ? 'tournament-write' : 'read-only-preflight',
  runId,
  strategyVersion,
  targetGames,
  completedGames,
  remainingGames,
  totalGamesBefore: totalGamesBefore.toString(),
  balances: {
    operator: formatEther(operatorBalance),
    opponent: formatEther(opponentBalance),
  },
  budget: {
    observedMaxFeePerGasWei: fees.maxFeePerGas.toString(),
    budgetFeePerGasWei: budgetFeePerGas.toString(),
    operatorGasPerGame: operatorGasPerGame.toString(),
    opponentGasPerGame: opponentGasPerGame.toString(),
    operatorReserveEth: formatEther(operatorReserve),
    requiredOpponentEth: formatEther(requiredOpponent),
    opponentFundingNeededEth: formatEther(opponentFundingNeeded),
    opponentFundingTransactionGasEth: formatEther(opponentFundingGas),
    totalOperatorRequiredEth: formatEther(totalOperatorRequired),
    operatorFundingGapEth: formatEther(operatorFundingGap),
  },
}, null, 2));

if (!allowWrites) {
  console.log('Preflight only. Set PLUNDRIX_ALLOW_SEPOLIA_TOURNAMENT_WRITES=true after both funding gaps are zero.');
  process.exit(operatorFundingGap === 0n ? 0 : 2);
}

assert(operatorFundingGap === 0n, `Operator needs ${formatEther(operatorFundingGap)} more Sepolia ETH for the guarded 50-game budget`);
await waitForPendingTransactions();
let report = existing || createReport(totalGamesBefore, {
  operator: formatEther(operatorBalance),
  opponent: formatEther(opponentBalance),
});
saveReport(report);

const refillFloorGames = BigInt(Math.min(5, remainingGames));
const refillTargetGames = BigInt(Math.min(10, remainingGames));
const refillFloor = refillFloorGames * opponentGasPerGame * budgetFeePerGas;
const refillTarget = refillTargetGames * opponentGasPerGame * budgetFeePerGas;
const initialFundingNeeded = report.fundingTransactions.length === 0 && opponentFundingNeeded > 0n;
const emergencyFundingNeeded = report.fundingTransactions.length > 0 && opponentBalance < refillFloor;
const refillAmount = initialFundingNeeded
  ? opponentFundingNeeded
  : emergencyFundingNeeded
    ? refillTarget - opponentBalance
    : 0n;
if (refillAmount > 0n) {
  const fundingTx = await fundOpponent(refillAmount);
  report.fundingTransactions.push(fundingTx);
  saveReport(report);
  console.log(`[fund] opponent=${formatEther(refillAmount)} tx=${fundingTx.hash}`);
}

for (const scheduled of schedule) {
  let gameRecord = report.games.find(({ scheduleIndex }) => scheduleIndex === scheduled.index);
  if (gameRecord?.status === 'complete') continue;
  if (!gameRecord) {
    gameRecord = {
      scheduleIndex: scheduled.index,
      pairing: scheduled.pairing,
      repetition: scheduled.repetition,
      status: 'creating',
      gameId: null,
      seatA: { agentId: scheduled.seatA, address: operatorAddress },
      seatB: { agentId: scheduled.seatB, address: opponentAddress },
      rounds: [],
      transactions: [],
    };
    report.games.push(gameRecord);
    saveReport(report);
  }

  if (!gameRecord.gameId) {
    gameRecord.transactions.push({ label: 'createGame', ...await write(operator, 'createGame') });
    gameRecord.gameId = (await read('totalGames')).toString();
    gameRecord.status = 'open';
    saveReport(report);
  }
  const gameId = BigInt(gameRecord.gameId);
  let [game, rawA, rawB] = await Promise.all([
    read('getGameInfo', [gameId]),
    read('getPlayerState', [gameId, operatorAddress]),
    read('getPlayerState', [gameId, opponentAddress]),
  ]);
  let stateA = playerState(rawA);
  let stateB = playerState(rawB);
  if (Number(game[0]) === 0) {
    if (!stateA.registered) {
      gameRecord.transactions.push({ label: 'registerSeatA', ...await write(operator, 'registerPlayer', [gameId]) });
      saveReport(report);
    }
    if (!stateB.registered) {
      gameRecord.transactions.push({ label: 'registerSeatB', ...await write(opponent, 'registerPlayer', [gameId]) });
      saveReport(report);
    }
    gameRecord.transactions.push({ label: 'startGame', ...await write(operator, 'startGame', [gameId]) });
    gameRecord.status = 'active';
    saveReport(report);
  }

  for (let attempt = 1; attempt <= maxRounds; attempt += 1) {
    [game, rawA, rawB] = await Promise.all([
      read('getGameInfo', [gameId]),
      read('getPlayerState', [gameId, operatorAddress]),
      read('getPlayerState', [gameId, opponentAddress]),
    ]);
    if (Number(game[0]) === 2) break;
    const round = Number(game[1]);
    stateA = playerState(rawA);
    stateB = playerState(rawB);
    let roundRecord = gameRecord.rounds.find((entry) => entry.round === round);
    if (!roundRecord) {
      roundRecord = {
        round,
        before: { seatA: stateA, seatB: stateB },
        seatA: chooseAgentAction(gameRecord.seatA.agentId, { self: stateA, opponent: stateB, round }),
        seatB: chooseAgentAction(gameRecord.seatB.agentId, { self: stateB, opponent: stateA, round }),
      };
      gameRecord.rounds.push(roundRecord);
      saveReport(report);
    }
    const existingEntropy = await read('getRoundEntropy', [gameId, BigInt(round)]);
    const needsOperatorAction = !stateA.actionSubmitted;
    const needsOpponentAction = !stateB.actionSubmitted;
    const needsEntropy = existingEntropy === 0n;
    const [operatorNonce, opponentNonce, feeQuote, entropy] = await Promise.all([
      needsOperatorAction || needsEntropy
        ? client.getTransactionCount({ address: operatorAddress, blockTag: 'pending' })
        : Promise.resolve(0),
      needsOpponentAction
        ? client.getTransactionCount({ address: opponentAddress, blockTag: 'pending' })
        : Promise.resolve(0),
      currentFeeQuote(),
      needsEntropy ? fetchEntropy(gameId, round) : Promise.resolve(0n),
    ]);
    const inputWrites = [];
    let nextOperatorNonce = operatorNonce;
    if (!stateA.actionSubmitted) {
      const target = roundRecord.seatA.targetOpponent ? opponentAddress : zeroAddress;
      inputWrites.push({
        label: `round${round}.seatA.${roundRecord.seatA.actionName}`,
        signer: operator,
        operatorFirst: true,
        serializedTransaction: await prepareSignedWrite(
          operator,
          'submitAction',
          [gameId, roundRecord.seatA.action, target],
          nextOperatorNonce,
          feeQuote,
        ),
      });
      nextOperatorNonce += 1;
    }
    if (!stateB.actionSubmitted) {
      const target = roundRecord.seatB.targetOpponent ? operatorAddress : zeroAddress;
      inputWrites.push({
        label: `round${round}.seatB.${roundRecord.seatB.actionName}`,
        signer: opponent,
        operatorFirst: false,
        serializedTransaction: await prepareSignedWrite(
          opponent,
          'submitAction',
          [gameId, roundRecord.seatB.action, target],
          opponentNonce,
          feeQuote,
        ),
      });
    }
    if (needsEntropy) {
      inputWrites.push({
        label: `round${round}.entropy`,
        signer: operator,
        operatorFirst: false,
        serializedTransaction: await prepareSignedWrite(
          operator,
          'provideRoundEntropy',
          [gameId, BigInt(round), entropy],
          nextOperatorNonce,
          feeQuote,
        ),
      });
    }
    const firstOperatorWrite = inputWrites.find(({ operatorFirst }) => operatorFirst);
    const submittedInputs = [];
    if (firstOperatorWrite) {
      submittedInputs.push({
        ...firstOperatorWrite,
        hash: await sendRawWithBackoff(
          firstOperatorWrite.serializedTransaction,
          firstOperatorWrite.label,
          firstOperatorWrite.signer,
        ),
      });
    }
    const remainingInputs = inputWrites.filter((entry) => entry !== firstOperatorWrite);
    submittedInputs.push(...await Promise.all(remainingInputs.map(async (entry) => ({
      ...entry,
      hash: await sendRawWithBackoff(entry.serializedTransaction, entry.label, entry.signer),
    }))));
    const confirmedInputs = await Promise.all(submittedInputs.map(async ({ label, hash }) => {
      const receipt = await waitForSuccess(hash, label);
      return {
        label,
        hash,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        costWei: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      };
    }));
    gameRecord.transactions.push(...confirmedInputs);
    saveReport(report);
    await waitForRead(
      () => read('allActionsSubmitted', [gameId]),
      `game ${gameId} round ${round} actions`,
    );
    await waitForRead(
      async () => (await read('getRoundEntropy', [gameId, BigInt(round)])) > 0n,
      `game ${gameId} round ${round} entropy`,
    );
    gameRecord.transactions.push({ label: `round${round}.resolve`, ...await write(operator, 'resolveRound', [gameId]) });
    const [afterA, afterB] = await Promise.all([
      read('getPlayerState', [gameId, operatorAddress]),
      read('getPlayerState', [gameId, opponentAddress]),
    ]);
    roundRecord.after = { seatA: playerState(afterA), seatB: playerState(afterB) };
    saveReport(report);
    console.log(`[game ${scheduled.index}/50] id=${gameId} round=${round} ${gameRecord.seatA.agentId}=${roundRecord.after.seatA.locks}/5 ${gameRecord.seatB.agentId}=${roundRecord.after.seatB.locks}/5`);
    if (roundPaceMs > 0) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, roundPaceMs));
    }
  }

  game = await read('getGameInfo', [gameId]);
  assert(Number(game[0]) === 2, `Game ${gameId} did not finish within ${maxRounds} rounds`);
  const winnerAddress = getAddress(game[4]);
  gameRecord.status = 'complete';
  gameRecord.roundCount = Number(game[1]);
  gameRecord.winnerAddress = winnerAddress;
  gameRecord.winnerAgentId = winnerAddress === operatorAddress ? gameRecord.seatA.agentId : gameRecord.seatB.agentId;
  gameRecord.completedAt = new Date().toISOString();
  saveReport(report);
  console.log(`[complete ${scheduled.index}/50] game=${gameId} winner=${gameRecord.winnerAgentId} rounds=${gameRecord.roundCount}`);
  const completedCount = report.games.filter(({ status }) => status === 'complete').length;
  if (stopAfterCompleted > 0 && completedCount >= stopAfterCompleted) {
    report.status = 'paused';
    saveReport(report);
    console.log(`Tournament paused after ${completedCount} completed games by TOURNAMENT_STOP_AFTER_COMPLETED`);
    process.exit(0);
  }
}

const [operatorBalanceAfter, opponentBalanceAfter] = await Promise.all([
  client.getBalance({ address: operatorAddress }),
  client.getBalance({ address: opponentAddress }),
]);
report.status = 'complete';
report.completedAt = new Date().toISOString();
report.finalBalances = {
  operator: formatEther(operatorBalanceAfter),
  opponent: formatEther(opponentBalanceAfter),
};
saveReport(report);
console.log(`Sepolia agent tournament complete: ${report.games.length}/${targetGames} report=${markdownPath}`);
