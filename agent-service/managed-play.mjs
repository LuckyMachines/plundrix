import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  zeroAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { agentConfig } from './config.mjs';
import { getGameHistory, getGameSnapshot, listGames } from './contract.mjs';

const gameAbi = JSON.parse(readFileSync(resolve(process.cwd(), 'abi', 'PlundrixGame.json'), 'utf8'));
const workshopAbi = JSON.parse(readFileSync(resolve(process.cwd(), 'abi', 'PlundrixWorkshop.json'), 'utf8'));
const transport = http(agentConfig.rpcUrl);
const publicClient = createPublicClient({ transport });
const sponsorAccount = agentConfig.managedPlayEnabled
  ? privateKeyToAccount(agentConfig.managedSponsorPrivateKey)
  : null;
const sponsorWallet = sponsorAccount ? createWalletClient({ account: sponsorAccount, transport }) : null;

const ACTIONS = Object.freeze({ pick: 1, search: 2, sabotage: 3 });
const ALLOWED_PACES = new Set([45, 90, 300]);
const COOKIE_NAME = 'plundrix_session';
let writeQueue = Promise.resolve();
let verifiedChainId = null;
let maintenanceTimer = null;

export class ManagedPlayError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ManagedPlayError';
    this.statusCode = statusCode;
  }
}

function signature(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSignedSession(
  secret,
  { id = randomBytes(16).toString('hex'), issuedAt = Math.floor(Date.now() / 1000) } = {},
) {
  if (String(secret || '').length < 32) throw new Error('Session secret must be at least 32 characters');
  const body = `v1.${Buffer.from(id).toString('base64url')}.${issuedAt}`;
  return `${body}.${signature(body, secret)}`;
}

export function verifySignedSession(
  token,
  secret,
  { now = Math.floor(Date.now() / 1000), maxAgeSeconds = 15_552_000 } = {},
) {
  const parts = String(token || '').split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new ManagedPlayError('Your play session expired. Refresh to continue.', 401);
  }
  const body = parts.slice(0, 3).join('.');
  const expected = Buffer.from(signature(body, secret));
  const supplied = Buffer.from(parts[3]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new ManagedPlayError('Your play session expired. Refresh to continue.', 401);
  }
  const issuedAt = Number(parts[2]);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > now + 60 || now - issuedAt > maxAgeSeconds) {
    throw new ManagedPlayError('Your play session expired. Refresh to continue.', 401);
  }
  const id = Buffer.from(parts[1], 'base64url').toString('utf8');
  if (!/^[a-f0-9]{32}$/.test(id)) {
    throw new ManagedPlayError('Your play session expired. Refresh to continue.', 401);
  }
  return { id, issuedAt };
}

function privateKeyFor(playerId) {
  const digest = createHmac('sha256', agentConfig.managedCustodySecret)
    .update(`plundrix-managed-player:${playerId}`)
    .digest('hex');
  return `0x${digest}`;
}

function publicIdentity(playerId) {
  const tag = createHash('sha256')
    .update(`operator:${playerId}`)
    .digest('hex')
    .slice(0, 5)
    .toUpperCase();
  return { id: playerId, displayName: `Operator ${tag}` };
}

function cookieValue(header, name) {
  const item = String(header || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export function managedCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${agentConfig.managedSessionMaxAgeSeconds}${secure}`;
}

export function createManagedSession() {
  assertManagedEnabled();
  const token = createSignedSession(agentConfig.managedSessionSecret);
  const session = verifySignedSession(token, agentConfig.managedSessionSecret, {
    maxAgeSeconds: agentConfig.managedSessionMaxAgeSeconds,
  });
  return { token, player: { displayName: publicIdentity(session.id).displayName } };
}

export function readManagedSession(cookieHeader) {
  assertManagedEnabled();
  const token = cookieValue(cookieHeader, COOKIE_NAME);
  const session = verifySignedSession(token, agentConfig.managedSessionSecret, {
    maxAgeSeconds: agentConfig.managedSessionMaxAgeSeconds,
  });
  return {
    ...publicIdentity(session.id),
    account: privateKeyToAccount(privateKeyFor(session.id)),
  };
}

function assertManagedEnabled() {
  if (!agentConfig.managedPlayEnabled) {
    throw new ManagedPlayError('Live operations are warming up. Try again shortly.', 503);
  }
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function readBudget() {
  const fresh = { day: utcDay(), fundedWei: '0', sponsoredWei: '0', commands: 0 };
  if (!existsSync(agentConfig.managedBudgetPath)) return fresh;
  try {
    const parsed = JSON.parse(readFileSync(agentConfig.managedBudgetPath, 'utf8'));
    return parsed.day === fresh.day ? parsed : fresh;
  } catch {
    return fresh;
  }
}

function writeBudget(record) {
  mkdirSync(dirname(agentConfig.managedBudgetPath), { recursive: true });
  const temporary = `${agentConfig.managedBudgetPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  renameSync(temporary, agentConfig.managedBudgetPath);
}

function readManagedOperationIds() {
  if (!existsSync(agentConfig.managedOperationsPath)) return [];
  try {
    const parsed = JSON.parse(readFileSync(agentConfig.managedOperationsPath, 'utf8'));
    return [...new Set((parsed.gameIds || [])
      .map(Number)
      .filter((gameId) => Number.isSafeInteger(gameId) && gameId > 0))]
      .slice(-500);
  } catch {
    return [];
  }
}

function writeManagedOperationIds(gameIds) {
  mkdirSync(dirname(agentConfig.managedOperationsPath), { recursive: true });
  const temporary = `${agentConfig.managedOperationsPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ gameIds, updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
  renameSync(temporary, agentConfig.managedOperationsPath);
}

function rememberManagedOperation(gameId) {
  const gameIds = readManagedOperationIds();
  if (!gameIds.includes(gameId)) writeManagedOperationIds([...gameIds, gameId].slice(-500));
}

async function verifyChain() {
  if (verifiedChainId !== null) return;
  const chainId = await publicClient.getChainId();
  if (chainId !== agentConfig.managedChainId) {
    throw new ManagedPlayError('Live operations are temporarily unavailable.', 503);
  }
  verifiedChainId = chainId;
}

function enqueue(operation) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.catch(() => undefined);
  return result;
}

async function feeQuote() {
  const fees = await publicClient.estimateFeesPerGas();
  const maxFeePerGas = fees.maxFeePerGas || await publicClient.getGasPrice();
  const quotedPriorityFee = fees.maxPriorityFeePerGas || 0n;
  if (maxFeePerGas > agentConfig.managedMaxGasPriceWei) {
    throw new ManagedPlayError('The game service is busy. Your command was not spent; try again shortly.', 503);
  }
  return {
    maxFeePerGas,
    maxPriorityFeePerGas: quotedPriorityFee > maxFeePerGas ? maxFeePerGas : quotedPriorityFee,
  };
}

async function reserveSponsorSpend(maximumCost) {
  const budget = readBudget();
  const sponsored = BigInt(budget.sponsoredWei || budget.fundedWei || 0);
  if (sponsored + maximumCost > agentConfig.managedDailyBudgetWei) {
    throw new ManagedPlayError('Today\'s live-operation capacity is full. Practice play is still available.', 503);
  }
  const sponsorBalance = await publicClient.getBalance({ address: sponsorAccount.address });
  if (sponsorBalance < maximumCost + agentConfig.managedSponsorReserveWei) {
    throw new ManagedPlayError('Live operations are refueling. Practice play is still available.', 503);
  }
  writeBudget({
    ...budget,
    sponsoredWei: String(sponsored + maximumCost),
    commands: Number(budget.commands || 0),
  });
}

async function fundPlayer(account, requiredWei, fees) {
  const balance = await publicClient.getBalance({ address: account.address });
  if (balance >= requiredWei) return;

  const multiplier = BigInt(Math.max(1, Math.floor(agentConfig.managedFundingMultiplier)));
  const desired = requiredWei * multiplier > agentConfig.managedMinimumFundingWei
    ? requiredWei * multiplier
    : agentConfig.managedMinimumFundingWei;
  const target = desired > agentConfig.managedMaximumPlayerBalanceWei
    ? agentConfig.managedMaximumPlayerBalanceWei
    : desired;
  const amount = target > balance ? target - balance : 0n;
  if (balance + amount < requiredWei) {
    throw new ManagedPlayError('This command exceeds the sponsored play limit.', 503);
  }

  const budget = readBudget();
  const funded = BigInt(budget.fundedWei || 0);
  const sponsored = BigInt(budget.sponsoredWei || budget.fundedWei || 0);
  const transferCost = 21_000n * fees.maxFeePerGas;
  if (sponsored + amount + transferCost > agentConfig.managedDailyBudgetWei) {
    throw new ManagedPlayError('Today\'s live-operation capacity is full. Practice play is still available.', 503);
  }
  const sponsorBalance = await publicClient.getBalance({ address: sponsorAccount.address });
  if (sponsorBalance < amount + transferCost + agentConfig.managedSponsorReserveWei) {
    throw new ManagedPlayError('Live operations are refueling. Practice play is still available.', 503);
  }

  const reservation = {
    ...budget,
    fundedWei: String(funded + amount),
    sponsoredWei: String(sponsored + amount + transferCost),
    commands: Number(budget.commands || 0),
  };
  writeBudget(reservation);
  try {
    const hash = await sponsorWallet.sendTransaction({
      to: account.address,
      value: amount,
      gas: 21_000n,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('Funding failed');
  } catch (error) {
    writeBudget(budget);
    throw error;
  }
}

async function writeManagedContractNow(account, { address, abi, functionName, args = [] }) {
  await verifyChain();
  const fees = await feeQuote();
  const gasEstimate = await publicClient.estimateContractGas({
    account,
    address,
    abi,
    functionName,
    args,
  });
  // Round resolution follows a fresh entropy path in the mined block, so its
  // storage writes can cost materially more than the preceding gas estimate.
  // A higher limit prevents random success branches from failing; unused gas
  // is not charged.
  const gasMarginPercent = functionName === 'resolveRound' ? 250n : 120n;
  const gas = (gasEstimate * gasMarginPercent) / 100n;
  const maximumCost = gas * fees.maxFeePerGas;
  if (maximumCost > agentConfig.managedMaxTransactionWei) {
    throw new ManagedPlayError('This command exceeds the sponsored play limit.', 503);
  }
  const sponsorCommand = account.address.toLowerCase() === sponsorAccount.address.toLowerCase();
  if (!sponsorCommand) {
    await fundPlayer(account, maximumCost, fees);
  }
  const wallet = sponsorCommand ? sponsorWallet : createWalletClient({ account, transport });
  const { request } = await publicClient.simulateContract({
    account,
    address,
    abi,
    functionName,
    args,
    gas,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  if (sponsorCommand) await reserveSponsorSpend(maximumCost);
  const hash = await wallet.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error('Command failed');
  const budget = readBudget();
  writeBudget({ ...budget, commands: Number(budget.commands || 0) + 1 });
  return receipt;
}

async function writeManagedContract(account, command) {
  return enqueue(() => writeManagedContractNow(account, command));
}

function safeOperationSummary(game) {
  return {
    id: game.gameId,
    state: game.state,
    stateCode: game.stateCode,
    currentRound: game.currentRound,
    playerCount: game.playerCount,
    roundEndsAt: game.roundEndsAt,
  };
}

export function safeLatestOutcomes(history = {}, snapshot = {}, playerAddress = '', playerDisplayName = 'You') {
  const rawPlayers = snapshot.players || [];
  const ownAddress = String(playerAddress).toLowerCase();
  const seatFor = (address) => rawPlayers.findIndex((player) => player.address.toLowerCase() === String(address || '').toLowerCase()) + 1;
  const outcomeEvents = (history.events || []).filter((event) => event.name === 'ActionOutcome');
  const latestRound = Math.max(0, ...outcomeEvents.map((event) => Number(event.args?.round || 0)));

  return outcomeEvents
    .filter((event) => Number(event.args?.round || 0) === latestRound)
    .map((event, index) => {
      const actorSeat = seatFor(event.args?.player);
      const targetSeat = seatFor(event.args?.sabotageTarget);
      const you = String(event.args?.player || '').toLowerCase() === ownAddress;
      return {
        id: `${latestRound}-${actorSeat || 'unknown'}-${index}`,
        round: latestRound,
        actor: you ? 'player-1' : `seat-${actorSeat || 'unknown'}`,
        actorLabel: you ? playerDisplayName : `Operator ${actorSeat || '?'}`,
        target: targetSeat ? (rawPlayers[targetSeat - 1]?.address.toLowerCase() === ownAddress ? 'player-1' : `seat-${targetSeat}`) : '',
        targetLabel: targetSeat ? (rawPlayers[targetSeat - 1]?.address.toLowerCase() === ownAddress ? playerDisplayName : `Operator ${targetSeat}`) : '',
        you,
        action: String(event.args?.action || 'NONE').toLowerCase(),
        actionCode: Number(event.args?.actionCode || 0),
        success: Boolean(event.args?.success),
        reasonCode: Number(event.args?.reasonCode || 0),
        locksCracked: Number(event.args?.locksCracked || 0),
        tools: Number(event.args?.tools || 0),
        stunned: Boolean(event.args?.stunned),
      };
    });
}

function freshEntropy() {
  const entropy = BigInt(`0x${randomBytes(32).toString('hex')}`);
  return entropy === 0n ? 1n : entropy;
}

async function settleManagedOperationNow(gameId) {
  const snapshot = await getGameSnapshot(gameId);
  if (snapshot.game.stateCode !== 1) return false;
  const timedOut = Math.floor(Date.now() / 1000) >= snapshot.game.roundEndsAt;
  if (!snapshot.allActionsSubmitted && !timedOut) return false;

  if (snapshot.automation.requireExternalEntropy) {
    const existingEntropy = await publicClient.readContract({
      address: agentConfig.contractAddress,
      abi: gameAbi,
      functionName: 'getRoundEntropy',
      args: [BigInt(gameId), BigInt(snapshot.game.currentRound)],
    });
    if (existingEntropy === 0n) {
      await writeManagedContractNow(sponsorAccount, {
        address: agentConfig.contractAddress,
        abi: gameAbi,
        functionName: 'provideRoundEntropy',
        args: [BigInt(gameId), BigInt(snapshot.game.currentRound), freshEntropy()],
      });
    }
  }

  await writeManagedContractNow(sponsorAccount, {
    address: agentConfig.contractAddress,
    abi: gameAbi,
    functionName: 'resolveRound',
    args: [BigInt(gameId)],
  });
  return true;
}

export function settleManagedOperation(gameId) {
  assertManagedEnabled();
  return enqueue(() => settleManagedOperationNow(gameId));
}

async function sweepManagedOperations() {
  const initialIds = readManagedOperationIds();
  const retained = [];
  for (const gameId of initialIds) {
    try {
      const snapshot = await getGameSnapshot(gameId);
      if (snapshot.game.stateCode === 2) continue;
      retained.push(gameId);
      if (snapshot.game.stateCode === 1) await settleManagedOperation(gameId);
    } catch (error) {
      const message = error?.shortMessage || error?.message || String(error);
      if (/game does not exist/i.test(message)) continue;
      retained.push(gameId);
      console.error('[managed-play-maintenance]', gameId, message);
    }
  }
  const addedDuringSweep = readManagedOperationIds().filter((gameId) => !initialIds.includes(gameId));
  writeManagedOperationIds([...new Set([...retained, ...addedDuringSweep])].slice(-500));
}

export function startManagedPlayMaintenance() {
  if (!agentConfig.managedPlayEnabled || maintenanceTimer) return maintenanceTimer;
  maintenanceTimer = setInterval(() => {
    sweepManagedOperations().catch((error) => {
      console.error('[managed-play-maintenance]', error?.shortMessage || error?.message || error);
    });
  }, agentConfig.managedSweepIntervalMs);
  maintenanceTimer.unref?.();
  return maintenanceTimer;
}

export async function listManagedOperations() {
  assertManagedEnabled();
  const result = await listGames(24, 0);
  return { operations: result.games.map(safeOperationSummary), count: result.count };
}

export async function getManagedOperation(gameId, session) {
  const snapshot = await getGameSnapshot(gameId);
  const playerAddress = session.account.address.toLowerCase();
  const players = snapshot.players.map((player, index) => ({
    seat: index + 1,
    label: player.address.toLowerCase() === playerAddress
      ? session.displayName
      : `Operator ${index + 1}`,
    locksCracked: player.locksCracked,
    tools: player.tools,
    stunned: player.stunned,
    actionSubmitted: player.actionSubmitted,
    you: player.address.toLowerCase() === playerAddress,
  }));
  const winnerIndex = snapshot.players.findIndex(
    (player) => player.address.toLowerCase() === snapshot.game.winner.toLowerCase(),
  );
  const participant = players.some((player) => player.you);
  let latestOutcomes = [];
  if (snapshot.game.currentRound > 1 || snapshot.game.stateCode === 2) {
    try {
      latestOutcomes = safeLatestOutcomes(await getGameHistory(gameId), snapshot, session.account.address, session.displayName);
    } catch (error) {
      console.error('[managed-play-history]', gameId, error?.shortMessage || error?.message || error);
    }
  }
  return {
    ...safeOperationSummary(snapshot.game),
    allActionsSubmitted: snapshot.allActionsSubmitted,
    paused: snapshot.paused,
    players,
    winnerSeat: winnerIndex >= 0 ? winnerIndex + 1 : null,
    latestOutcomes,
    participant,
    canJoin: snapshot.game.stateCode === 0
      && snapshot.game.playerCount < snapshot.constants.maxGamePlayers
      && !participant,
    canStart: snapshot.game.stateCode === 0
      && snapshot.game.playerCount >= snapshot.constants.minGamePlayers
      && participant,
  };
}

export async function createManagedOperation(session, body = {}) {
  const pace = Number(body.pace || 90);
  if (!ALLOWED_PACES.has(pace)) {
    throw new ManagedPlayError('Choose a 45, 90, or 300 second round pace.');
  }
  const receipt = await writeManagedContract(session.account, {
    address: agentConfig.contractAddress,
    abi: gameAbi,
    functionName: 'createGameWithPace',
    args: [BigInt(pace)],
  });
  let gameId = null;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: gameAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === 'GameCreated') gameId = Number(decoded.args.gameID);
    } catch {
      // Linked-module logs are not part of this response.
    }
  }
  if (!gameId) {
    throw new ManagedPlayError('The operation was created but could not be opened. Refresh the table list.', 503);
  }
  rememberManagedOperation(gameId);
  await joinManagedOperation(gameId, session);
  return getManagedOperation(gameId, session);
}

export async function joinManagedOperation(gameId, session) {
  await writeManagedContract(session.account, {
    address: agentConfig.contractAddress,
    abi: gameAbi,
    functionName: 'registerPlayer',
    args: [BigInt(gameId)],
  });
  rememberManagedOperation(Number(gameId));
  return getManagedOperation(gameId, session);
}

export async function startManagedOperation(gameId, session) {
  await writeManagedContract(session.account, {
    address: agentConfig.contractAddress,
    abi: gameAbi,
    functionName: 'startGame',
    args: [BigInt(gameId)],
  });
  rememberManagedOperation(Number(gameId));
  return getManagedOperation(gameId, session);
}

export async function submitManagedAction(gameId, session, body = {}) {
  const action = ACTIONS[String(body.action || '').toLowerCase()];
  if (!action) throw new ManagedPlayError('Choose Pick, Search, or Sabotage.');
  const snapshot = await getGameSnapshot(gameId);
  const ownAddress = session.account.address.toLowerCase();
  const self = snapshot.players.find((player) => player.address.toLowerCase() === ownAddress);
  if (!self) throw new ManagedPlayError('Join this operation before choosing an action.');
  let sabotageTarget = zeroAddress;
  if (action === ACTIONS.sabotage) {
    const targetSeat = Number(body.targetSeat);
    const target = snapshot.players[targetSeat - 1];
    if (!target || target.address.toLowerCase() === ownAddress) {
      throw new ManagedPlayError('Choose another operator as the sabotage target.');
    }
    sabotageTarget = target.address;
  }
  await writeManagedContract(session.account, {
    address: agentConfig.contractAddress,
    abi: gameAbi,
    functionName: 'submitAction',
    args: [BigInt(gameId), action, sabotageTarget],
  });
  let resolutionPending = false;
  try {
    await settleManagedOperation(gameId);
  } catch (error) {
    resolutionPending = true;
    console.error('[managed-play-resolution]', gameId, error?.shortMessage || error?.message || error);
  }
  const operation = await getManagedOperation(gameId, session);
  return {
    ...operation,
    resolutionPending: resolutionPending || operation.allActionsSubmitted,
  };
}

export async function getManagedWorkshop(session) {
  await verifyChain();
  const [state, crafted] = await Promise.all([
    publicClient.readContract({
      address: agentConfig.workshopAddress,
      abi: workshopAbi,
      functionName: 'getWorkshopState',
      args: [session.account.address],
    }),
    publicClient.readContract({
      address: agentConfig.workshopAddress,
      abi: workshopAbi,
      functionName: 'getCraftedBlueprints',
      args: [session.account.address],
    }),
  ]);
  return {
    equippedBlueprintId: Number(state[0]),
    craftedCount: Number(state[1]),
    materials: state[2].map(Number),
    craftedBlueprintIds: crafted.map(Number),
  };
}

export async function updateManagedWorkshop(session, body = {}) {
  const functionName = {
    craft: 'craftBlueprint',
    equip: 'equipBlueprint',
    reclaim: 'reclaimBlueprint',
  }[body.operation];
  const blueprintId = Number(body.blueprintId);
  if (!functionName || !Number.isInteger(blueprintId) || blueprintId < 1 || blueprintId > 1200) {
    throw new ManagedPlayError('Choose a valid workshop command.');
  }
  await writeManagedContract(session.account, {
    address: agentConfig.workshopAddress,
    abi: workshopAbi,
    functionName,
    args: [BigInt(blueprintId)],
  });
  return getManagedWorkshop(session);
}

export function managedPlayStatus() {
  return { enabled: agentConfig.managedPlayEnabled, mode: 'managed-game-service' };
}

export function managedError(error) {
  if (error instanceof ManagedPlayError) return error;
  const message = String(error?.shortMessage || error?.message || '');
  const known = [
    [/already registered/i, 'You already joined this operation.'],
    [/not enough players/i, 'At least two operators are required to start.'],
    [/action already submitted/i, 'Your action is already locked for this round.'],
    [/insufficient salvage/i, 'More salvage is required for this blueprint.'],
    [/already crafted/i, 'That blueprint is already assembled.'],
    [/not owned/i, 'Assemble this blueprint before equipping it.'],
    [/game not open/i, 'This operation is no longer accepting players.'],
  ].find(([pattern]) => pattern.test(message));
  return new ManagedPlayError(
    known?.[1] || 'The game service could not complete that command. Please try again.',
    503,
  );
}
