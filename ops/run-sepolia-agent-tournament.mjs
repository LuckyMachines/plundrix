import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatEther,
  createPublicClient,
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
  sendTransactionWithKms,
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
const reportDir = resolve(root, 'reports/sepolia-agent-tournament');
const statePath = resolve(reportDir, 'state.json');
const markdownPath = resolve(reportDir, 'report.md');
const configuredRpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
const rpcUrls = configuredRpcUrl
  ? [configuredRpcUrl, 'https://sepolia.gateway.tenderly.co', 'https://1rpc.io/sepolia']
  : ['https://sepolia.gateway.tenderly.co', 'https://1rpc.io/sepolia', 'https://ethereum-sepolia-rpc.publicnode.com'];
const contractAddress = getAddress(process.env.SEPOLIA_CONTRACT_ADDRESS || '0x1FF715D46470B4024D88A12838e08A60855f0AE2');
const operatorAddress = getAddress(process.env.SEPOLIA_OPERATOR_ADDRESS || '0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79');
const opponentAddress = getAddress(process.env.SEPOLIA_OPPONENT_ADDRESS || '0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f');
const operatorConfig = getKmsKeyConfig({ key: process.env.SEPOLIA_OPERATOR_KMS_KEY || 'autoloop-deployer' });
const opponentConfig = getKmsKeyConfig({ key: process.env.SEPOLIA_OPPONENT_KMS_KEY || 'plundrix-deployer' });
const allowWrites = process.env.PLUNDRIX_ALLOW_SEPOLIA_TOURNAMENT_WRITES === 'true';
const targetGames = Number(process.env.TOURNAMENT_TARGET_GAMES || '50');
const maxRounds = Number(process.env.TOURNAMENT_MAX_ROUNDS || '30');
const operatorReserve = parseEther(process.env.SEPOLIA_OPERATOR_RESERVE_ETH || '0.02');
const operatorGasPerGame = BigInt(process.env.TOURNAMENT_OPERATOR_GAS_PER_GAME || '3000000');
const opponentGasPerGame = BigInt(process.env.TOURNAMENT_OPPONENT_GAS_PER_GAME || '900000');
const feeSafetyBps = BigInt(process.env.TOURNAMENT_FEE_SAFETY_BPS || '12500');
const client = createPublicClient({
  chain: sepolia,
  transport: fallback(rpcUrls.map((url) => http(url, { timeout: 12_000, retryCount: 1 }))),
});
const schedule = buildTournamentSchedule(5).slice(0, targetGames);
const operator = { address: operatorAddress, config: operatorConfig };
const opponent = { address: opponentAddress, config: opponentConfig };

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function waitForSuccess(hash, label) {
  const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 1 });
  assert(receipt.status === 'success', `${label} reverted: ${hash}`);
  return receipt;
}

async function write(signer, functionName, args = []) {
  const hash = await writeContractWithKms({
    client,
    address: signer.address,
    contractAddress,
    abi: artifact.abi,
    functionName,
    args,
    ...signer.config,
  });
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
  const response = await fetch('https://api.drand.sh/public/latest', { cache: 'no-store' });
  assert(response.ok, `drand returned HTTP ${response.status}`);
  const payload = await response.json();
  assert(payload.randomness, 'drand returned no randomness');
  return BigInt(keccak256(toHex(`${payload.randomness}:${payload.round}:${gameId}:${round}`)));
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
let report = existing || createReport(totalGamesBefore, {
  operator: formatEther(operatorBalance),
  opponent: formatEther(opponentBalance),
});
saveReport(report);

if (opponentFundingNeeded > 0n) {
  const fundingTx = await fundOpponent(opponentFundingNeeded);
  report.fundingTransactions.push(fundingTx);
  saveReport(report);
  console.log(`[fund] opponent=${formatEther(opponentFundingNeeded)} tx=${fundingTx.hash}`);
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
    if (!stateA.actionSubmitted) {
      const target = roundRecord.seatA.targetOpponent ? opponentAddress : zeroAddress;
      gameRecord.transactions.push({ label: `round${round}.seatA.${roundRecord.seatA.actionName}`, ...await write(operator, 'submitAction', [gameId, roundRecord.seatA.action, target]) });
      saveReport(report);
    }
    if (!stateB.actionSubmitted) {
      const target = roundRecord.seatB.targetOpponent ? operatorAddress : zeroAddress;
      gameRecord.transactions.push({ label: `round${round}.seatB.${roundRecord.seatB.actionName}`, ...await write(opponent, 'submitAction', [gameId, roundRecord.seatB.action, target]) });
      saveReport(report);
    }
    if ((await read('getRoundEntropy', [gameId, BigInt(round)])) === 0n) {
      gameRecord.transactions.push({ label: `round${round}.entropy`, ...await write(operator, 'provideRoundEntropy', [gameId, BigInt(round), await fetchEntropy(gameId, round)]) });
      saveReport(report);
    }
    gameRecord.transactions.push({ label: `round${round}.resolve`, ...await write(operator, 'resolveRound', [gameId]) });
    const [afterA, afterB] = await Promise.all([
      read('getPlayerState', [gameId, operatorAddress]),
      read('getPlayerState', [gameId, opponentAddress]),
    ]);
    roundRecord.after = { seatA: playerState(afterA), seatB: playerState(afterB) };
    saveReport(report);
    console.log(`[game ${scheduled.index}/50] id=${gameId} round=${round} ${gameRecord.seatA.agentId}=${roundRecord.after.seatA.locks}/5 ${gameRecord.seatB.agentId}=${roundRecord.after.seatB.locks}/5`);
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
