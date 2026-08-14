import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatEther,
  getAddress,
  keccak256,
  parseEther,
  toHex,
  zeroAddress,
} from 'viem';
import {
  createChainClient,
  getKmsKeyConfig,
  sendTransactionWithKms,
  writeContractWithKms,
} from './kms-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifact = JSON.parse(readFileSync(
  resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'),
  'utf8',
));

const rpcUrl = process.env.SEPOLIA_RPC_URL
  || process.env.RPC_URL
  || 'https://ethereum-sepolia-rpc.publicnode.com';
const contractAddress = getAddress(process.env.SEPOLIA_CONTRACT_ADDRESS
  || '0x1FF715D46470B4024D88A12838e08A60855f0AE2');
const operatorAddress = getAddress(process.env.SEPOLIA_OPERATOR_ADDRESS
  || '0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79');
const opponentAddress = getAddress(process.env.SEPOLIA_OPPONENT_ADDRESS
  || '0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f');
const operatorConfig = getKmsKeyConfig({
  key: process.env.SEPOLIA_OPERATOR_KMS_KEY || 'autoloop-deployer',
});
const opponentConfig = getKmsKeyConfig({
  key: process.env.SEPOLIA_OPPONENT_KMS_KEY || 'plundrix-deployer',
});
const allowWrites = process.env.PLUNDRIX_ALLOW_SEPOLIA_WRITES === 'true';
const opponentTargetBalance = parseEther(process.env.SEPOLIA_PLAYER_TARGET_ETH || '0.006');
const minimumOperatorReserve = parseEther(process.env.SEPOLIA_OPERATOR_RESERVE_ETH || '0.02');
const maxRounds = Number(process.env.SEPOLIA_MAX_ROUNDS || '18');
const client = createChainClient({ chainName: 'sepolia', rpcUrl });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(functionName, args = []) {
  return client.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName,
    args,
  });
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
  return { hash, gasUsed: receipt.gasUsed.toString() };
}

async function fetchEntropy(gameId, round) {
  const response = await fetch('https://api.drand.sh/public/latest', { cache: 'no-store' });
  assert(response.ok, `drand returned HTTP ${response.status}`);
  const payload = await response.json();
  assert(payload.randomness, 'drand returned no randomness');
  return BigInt(keccak256(toHex(`${payload.randomness}:${payload.round}:${gameId}:${round}`)));
}

const operator = { address: operatorAddress, config: operatorConfig };
const opponent = { address: opponentAddress, config: opponentConfig };
const requiredRoles = [
  'DEFAULT_ADMIN_ROLE',
  'GAME_MASTER_ROLE',
  'AUTO_RESOLVER_ROLE',
  'RANDOMIZER_ROLE',
];
const roleChecks = {};

for (const roleName of requiredRoles) {
  const role = await read(roleName);
  roleChecks[roleName] = await read('hasRole', [role, operatorAddress]);
  assert(roleChecks[roleName], `${operatorAddress} is missing ${roleName}`);
}

const [paused, totalGamesBefore, automation, operatorBalanceBefore, opponentBalanceBefore] = await Promise.all([
  read('paused'),
  read('totalGames'),
  read('getAutomationSettings'),
  client.getBalance({ address: operatorAddress }),
  client.getBalance({ address: opponentAddress }),
]);
assert(!paused, 'Sepolia contract is paused');
assert(automation[2] === true, 'Sepolia must require external entropy for this proof');
const feeEstimate = await client.estimateFeesPerGas();
const projectedOperatorGas = (BigInt(maxRounds) * 600000n) + 700000n;
const projectedOperatorCost = projectedOperatorGas * feeEstimate.maxFeePerGas;
const fundingNeeded = opponentBalanceBefore < opponentTargetBalance
  ? opponentTargetBalance - opponentBalanceBefore
  : 0n;

console.log(JSON.stringify({
  mode: allowWrites ? 'funded-write' : 'read-only-preflight',
  contractAddress,
  operatorAddress,
  opponentAddress,
  totalGamesBefore: totalGamesBefore.toString(),
  operatorBalanceEth: formatEther(operatorBalanceBefore),
  opponentBalanceEth: formatEther(opponentBalanceBefore),
  budget: {
    opponentFundingNeededEth: formatEther(fundingNeeded),
    projectedOperatorCostEth: formatEther(projectedOperatorCost),
    minimumOperatorReserveEth: formatEther(minimumOperatorReserve),
    maxRounds,
  },
  roleChecks,
  automation: {
    enabled: automation[0],
    delaySeconds: automation[1].toString(),
    externalEntropyRequired: automation[2],
  },
}, null, 2));

if (!allowWrites) {
  console.log('Preflight passed. Set PLUNDRIX_ALLOW_SEPOLIA_WRITES=true to run the funded proof.');
  process.exit(0);
}

assert(Number.isInteger(maxRounds) && maxRounds >= 5 && maxRounds <= 40, 'SEPOLIA_MAX_ROUNDS must be 5-40');
assert(
  operatorBalanceBefore - fundingNeeded - projectedOperatorCost >= minimumOperatorReserve,
  `Funding and the projected gas ceiling would reduce the operator below its ${formatEther(minimumOperatorReserve)} ETH reserve`,
);
console.log(`[budget] opponentTargetEth=${formatEther(opponentTargetBalance)} projectedOperatorCostEth=${formatEther(projectedOperatorCost)} reserveEth=${formatEther(minimumOperatorReserve)}`);

const transactions = [];
if (fundingNeeded > 0n) {
  const hash = await sendTransactionWithKms({
    client,
    address: operatorAddress,
    to: opponentAddress,
    value: fundingNeeded,
    ...operatorConfig,
  });
  const receipt = await waitForSuccess(hash, 'fund opponent');
  transactions.push({ label: 'fundOpponent', hash, gasUsed: receipt.gasUsed.toString() });
  console.log(`[tx] fundOpponent=${hash} amountEth=${formatEther(fundingNeeded)}`);
}

transactions.push({ label: 'createGame', ...await write(operator, 'createGame') });
const gameId = await read('totalGames');
assert(gameId === totalGamesBefore + 1n, `Expected game ${totalGamesBefore + 1n}, got ${gameId}`);
const [mode, entryFee] = await read('getGameMode', [gameId]);
assert(Number(mode) === 0 && entryFee === 0n, 'Refusing to continue: created game is not FREE');

transactions.push({ label: 'registerOperator', ...await write(operator, 'registerPlayer', [gameId]) });
transactions.push({ label: 'registerOpponent', ...await write(opponent, 'registerPlayer', [gameId]) });
transactions.push({ label: 'startGame', ...await write(operator, 'startGame', [gameId]) });

const rounds = [];
for (let attempt = 1; attempt <= maxRounds; attempt += 1) {
  const game = await read('getGameInfo', [gameId]);
  if (Number(game[0]) === 2) break;
  const round = game[1];
  const operatorState = await read('getPlayerState', [gameId, operatorAddress]);
  const opponentState = await read('getPlayerState', [gameId, opponentAddress]);
  const operatorAction = operatorState[1] < 3n ? 2 : 1;
  const opponentAction = opponentState[1] < 3n ? 2 : 1;

  const operatorSubmit = await write(operator, 'submitAction', [gameId, operatorAction, zeroAddress]);
  const opponentSubmit = await write(opponent, 'submitAction', [gameId, opponentAction, zeroAddress]);
  const entropy = await fetchEntropy(gameId, round);
  const entropyTx = await write(operator, 'provideRoundEntropy', [gameId, round, entropy]);
  const resolveTx = await write(operator, 'resolveRound', [gameId]);
  transactions.push(
    { label: `round${round}.operatorAction`, ...operatorSubmit },
    { label: `round${round}.opponentAction`, ...opponentSubmit },
    { label: `round${round}.entropy`, ...entropyTx },
    { label: `round${round}.resolve`, ...resolveTx },
  );

  const operatorAfter = await read('getPlayerState', [gameId, operatorAddress]);
  const opponentAfter = await read('getPlayerState', [gameId, opponentAddress]);
  rounds.push({
    round: round.toString(),
    operator: { locks: operatorAfter[0].toString(), tools: operatorAfter[1].toString() },
    opponent: { locks: opponentAfter[0].toString(), tools: opponentAfter[1].toString() },
  });
  console.log(`[round] ${round} operator=${operatorAfter[0]}/5 opponent=${opponentAfter[0]}/5`);
}

const [finalGame, operatorBalanceAfter, opponentBalanceAfter] = await Promise.all([
  read('getGameInfo', [gameId]),
  client.getBalance({ address: operatorAddress }),
  client.getBalance({ address: opponentAddress }),
]);
assert(Number(finalGame[0]) === 2, `Game ${gameId} did not finish within ${maxRounds} rounds`);

const report = {
  verifiedAt: new Date().toISOString(),
  chainId: 11155111,
  contractAddress,
  gameId: gameId.toString(),
  mode: 'FREE',
  winner: finalGame[4],
  rounds,
  transactions,
  balances: {
    operatorBefore: formatEther(operatorBalanceBefore),
    operatorAfter: formatEther(operatorBalanceAfter),
    opponentBefore: formatEther(opponentBalanceBefore),
    opponentAfter: formatEther(opponentBalanceAfter),
  },
};
const reportPath = resolve(root, 'reports/sepolia-funded/latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Funded Sepolia proof passed: game=${gameId} winner=${finalGame[4]} report=${reportPath}`);
