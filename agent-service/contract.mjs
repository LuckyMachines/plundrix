import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPublicClient, http, isAddress } from 'viem';
import { agentConfig } from './config.mjs';
import {
  normalizeActionCode,
  normalizeGameStateCode,
} from './strategy.mjs';

const abiPath = resolve(process.cwd(), 'abi', 'PlundrixGame.json');
const abi = JSON.parse(readFileSync(abiPath, 'utf8'));
const client = createPublicClient({
  transport: http(agentConfig.rpcUrl),
});

const cachedConstants = {
  value: null,
};

function asNumber(value) {
  return Number(value);
}

function parseGameId(gameId) {
  const parsed = Number(gameId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid gameId');
  }
  return BigInt(parsed);
}

async function readContract(functionName, args = []) {
  return client.readContract({
    address: agentConfig.contractAddress,
    abi,
    functionName,
    args,
  });
}

export async function getTotalGames() {
  return asNumber(await readContract('totalGames'));
}

async function getConstants() {
  if (cachedConstants.value) return cachedConstants.value;

  const [
    totalLocks,
    maxTools,
    maxGamePlayers,
    minGamePlayers,
    roundTimeout,
  ] = await Promise.all([
    readContract('TOTAL_LOCKS'),
    readContract('MAX_TOOLS'),
    readContract('MAX_GAME_PLAYERS'),
    readContract('MIN_GAME_PLAYERS'),
    readContract('ROUND_TIMEOUT'),
  ]);

  cachedConstants.value = {
    totalLocks: asNumber(totalLocks),
    maxTools: asNumber(maxTools),
    maxGamePlayers: asNumber(maxGamePlayers),
    minGamePlayers: asNumber(minGamePlayers),
    roundTimeout: asNumber(roundTimeout),
  };

  return cachedConstants.value;
}

async function getPlayerAddresses(gameId, playerCount) {
  return Promise.all(
    Array.from({ length: playerCount }, (_, index) =>
      readContract('getPlayerAddress', [gameId, BigInt(index + 1)])
    )
  );
}

async function getPlayerStates(gameId, playerAddresses) {
  return Promise.all(
    playerAddresses.map(async (address, index) => {
      const [locksCracked, tools, stunned, registered, actionSubmitted] =
        await readContract('getPlayerState', [gameId, address]);

      return {
        index: index + 1,
        address,
        locksCracked: asNumber(locksCracked),
        tools: asNumber(tools),
        stunned: Boolean(stunned),
        registered: Boolean(registered),
        actionSubmitted: Boolean(actionSubmitted),
      };
    })
  );
}

export async function listGames(limit = 20, offset = 0) {
  const totalGames = await getTotalGames();
  const boundedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const boundedOffset = Math.max(0, Number(offset) || 0);
  const end = Math.max(totalGames - boundedOffset, 0);
  const start = Math.max(end - boundedLimit, 0);
  const ids = [];

  for (let current = end; current > start; current -= 1) {
    ids.push(BigInt(current));
  }

  const summaries = await Promise.all(ids.map((gameId) => getGameSummary(gameId)));

  return {
    totalGames,
    count: summaries.length,
    offset: boundedOffset,
    limit: boundedLimit,
    games: summaries,
  };
}

export async function getGameSummary(gameIdInput) {
  const gameId = typeof gameIdInput === 'bigint' ? gameIdInput : parseGameId(gameIdInput);
  const constants = await getConstants();
  const [stateCode, currentRound, playerCount, roundStartTime, winner] =
    await readContract('getGameInfo', [gameId]);

  return {
    gameId: asNumber(gameId),
    state: normalizeGameStateCode(asNumber(stateCode)),
    stateCode: asNumber(stateCode),
    currentRound: asNumber(currentRound),
    playerCount: asNumber(playerCount),
    roundStartTime: asNumber(roundStartTime),
    roundEndsAt: asNumber(roundStartTime) + constants.roundTimeout,
    winner,
  };
}

export async function getGameSnapshot(gameIdInput) {
  const gameId = typeof gameIdInput === 'bigint' ? gameIdInput : parseGameId(gameIdInput);
  const constants = await getConstants();
  const [game, allActionsSubmitted, automation, paused] = await Promise.all([
    getGameSummary(gameId),
    readContract('allActionsSubmitted', [gameId]),
    readContract('getAutomationSettings'),
    readContract('paused'),
  ]);

  const playerAddresses =
    game.playerCount > 0 ? await getPlayerAddresses(gameId, game.playerCount) : [];
  const players =
    playerAddresses.length > 0
      ? await getPlayerStates(gameId, playerAddresses)
      : [];

  return {
    gameId: game.gameId,
    game,
    paused: Boolean(paused),
    allActionsSubmitted: Boolean(allActionsSubmitted),
    constants,
    automation: {
      autoResolveEnabled: Boolean(automation[0]),
      autoResolveDelay: asNumber(automation[1]),
      requireExternalEntropy: Boolean(automation[2]),
    },
    players,
  };
}

export async function getGameHistory(
  gameIdInput,
  { fromBlock, toBlock } = {}
) {
  const gameId = typeof gameIdInput === 'bigint' ? gameIdInput : parseGameId(gameIdInput);
  const latestBlock = toBlock ?? (await client.getBlockNumber());
  const earliestBlock =
    fromBlock ??
    (latestBlock > agentConfig.historyLookbackBlocks
      ? latestBlock - agentConfig.historyLookbackBlocks
      : 0n);

  const eventNames = [
    'GameCreated',
    'PlayerJoined',
    'GameStarted',
    'ActionSubmitted',
    'ActionOutcome',
    'RoundResolved',
    'RoundAutoResolved',
    'GameWon',
    'PlayerSabotaged',
    'PlayerStunned',
    'ToolFound',
    'LockCracked',
  ];

  const results = await Promise.all(
    eventNames.map((eventName) =>
      client.getContractEvents({
        address: agentConfig.contractAddress,
        abi,
        eventName,
        args: { gameID: gameId },
        fromBlock: earliestBlock,
        toBlock: latestBlock,
        strict: false,
      })
    )
  );

  const events = results
    .flat()
    .map((log) => ({
      name: log.eventName,
      blockNumber: asNumber(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      args: normalizeLogArgs(log.args || {}),
    }))
    .sort((left, right) => {
      if (left.blockNumber !== right.blockNumber) {
        return left.blockNumber - right.blockNumber;
      }
      return Number(left.logIndex - right.logIndex);
    });

  return {
    gameId: asNumber(gameId),
    fromBlock: asNumber(earliestBlock),
    toBlock: asNumber(latestBlock),
    count: events.length,
    events,
  };
}

function normalizeLogArgs(args) {
  const normalized = {};

  for (const [key, value] of Object.entries(args)) {
    if (typeof key === 'string' && /^\d+$/.test(key)) continue;

    if (typeof value === 'bigint') {
      normalized[key] = asNumber(value);
      continue;
    }

    normalized[key] = value;
  }

  if (typeof args.action === 'number' || typeof args.action === 'bigint') {
    normalized.action = normalizeActionCode(asNumber(args.action));
    normalized.actionCode = asNumber(args.action);
  }

  if (typeof args.reason === 'number' || typeof args.reason === 'bigint') {
    normalized.reasonCode = asNumber(args.reason);
  }

  return normalized;
}

export function parsePlayerAddress(address) {
  if (!isAddress(address)) {
    throw new Error('Invalid player address');
  }
  return address;
}
