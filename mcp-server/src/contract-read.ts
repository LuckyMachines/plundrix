import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPublicClient, http, isAddress, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { mcpConfig } from './config.js';

const abiPath = resolve(process.cwd(), 'abi', 'PlundrixGame.json');
const abi = JSON.parse(readFileSync(abiPath, 'utf8'));
export { abi };

const client = createPublicClient({
  chain: sepolia,
  transport: http(mcpConfig.rpcUrl),
});
export { client };

function asNumber(value: unknown): number {
  return Number(value);
}

function parseGameId(gameId: string | number): bigint {
  const parsed = Number(gameId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid gameId');
  }
  return BigInt(parsed);
}

async function readContract(functionName: string, args: unknown[] = []): Promise<any> {
  return client.readContract({
    address: mcpConfig.contractAddress!,
    abi,
    functionName,
    args,
  });
}

// Cached constants
let cachedConstants: Record<string, number> | null = null;

async function getConstants() {
  if (cachedConstants) return cachedConstants;

  const [totalLocks, maxTools, maxGamePlayers, minGamePlayers, roundTimeout] =
    await Promise.all([
      readContract('TOTAL_LOCKS'),
      readContract('MAX_TOOLS'),
      readContract('MAX_GAME_PLAYERS'),
      readContract('MIN_GAME_PLAYERS'),
      readContract('ROUND_TIMEOUT'),
    ]);

  cachedConstants = {
    totalLocks: asNumber(totalLocks),
    maxTools: asNumber(maxTools),
    maxGamePlayers: asNumber(maxGamePlayers),
    minGamePlayers: asNumber(minGamePlayers),
    roundTimeout: asNumber(roundTimeout),
  };
  return cachedConstants;
}

export async function getTotalGames(): Promise<number> {
  return asNumber(await readContract('totalGames'));
}

export async function listGames(limit = 20, offset = 0) {
  const totalGames = await getTotalGames();
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const boundedOffset = Math.max(0, offset);
  const end = Math.max(totalGames - boundedOffset, 0);
  const start = Math.max(end - boundedLimit, 0);
  const ids: bigint[] = [];
  for (let current = end; current > start; current -= 1) {
    ids.push(BigInt(current));
  }
  const summaries = await Promise.all(ids.map(getGameSummary));
  return { totalGames, count: summaries.length, offset: boundedOffset, limit: boundedLimit, games: summaries };
}

export async function getGameSummary(gameIdInput: bigint | string | number) {
  const gameId = typeof gameIdInput === 'bigint' ? gameIdInput : parseGameId(String(gameIdInput));
  const constants = await getConstants();
  const [stateCode, currentRound, playerCount, roundStartTime, winner] =
    await readContract('getGameInfo', [gameId]) as [bigint, bigint, bigint, bigint, Address];

  return {
    gameId: asNumber(gameId),
    stateCode: asNumber(stateCode),
    currentRound: asNumber(currentRound),
    playerCount: asNumber(playerCount),
    roundStartTime: asNumber(roundStartTime),
    roundEndsAt: asNumber(roundStartTime) + constants!.roundTimeout,
    winner,
  };
}

export async function getGameSnapshot(gameIdInput: string | number) {
  const gameId = parseGameId(String(gameIdInput));
  const constants = await getConstants();

  const [game, allActionsSubmitted, automation, paused] = await Promise.all([
    getGameSummary(gameId),
    readContract('allActionsSubmitted', [gameId]),
    readContract('getAutomationSettings'),
    readContract('paused'),
  ]);

  const playerCount = game.playerCount;
  const playerAddresses: Address[] = playerCount > 0
    ? await Promise.all(
        Array.from({ length: playerCount }, (_, i) =>
          readContract('getPlayerAddress', [gameId, BigInt(i + 1)]) as Promise<Address>
        )
      )
    : [];

  const players = await Promise.all(
    playerAddresses.map(async (address, index) => {
      const [locksCracked, tools, stunned, registered, actionSubmitted] =
        await readContract('getPlayerState', [gameId, address]) as [bigint, bigint, boolean, boolean, boolean];
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

  const automationResult = automation as [boolean, bigint, boolean];

  return {
    gameId: game.gameId,
    game,
    paused: Boolean(paused),
    allActionsSubmitted: Boolean(allActionsSubmitted),
    constants,
    automation: {
      autoResolveEnabled: Boolean(automationResult[0]),
      autoResolveDelay: asNumber(automationResult[1]),
      requireExternalEntropy: Boolean(automationResult[2]),
    },
    players,
  };
}

export async function getGameHistory(gameIdInput: string | number, opts: { fromBlock?: bigint; toBlock?: bigint } = {}) {
  const gameId = parseGameId(String(gameIdInput));
  const latestBlock = opts.toBlock ?? (await client.getBlockNumber());
  const earliestBlock =
    opts.fromBlock ??
    (latestBlock > mcpConfig.historyLookbackBlocks
      ? latestBlock - mcpConfig.historyLookbackBlocks
      : 0n);

  const eventNames = [
    'GameCreated', 'PlayerJoined', 'GameStarted',
    'ActionSubmitted', 'ActionOutcome', 'RoundResolved',
    'RoundAutoResolved', 'GameWon', 'PlayerSabotaged',
    'PlayerStunned', 'ToolFound', 'LockCracked',
  ];

  const results = await Promise.all(
    eventNames.map((eventName) =>
      client.getContractEvents({
        address: mcpConfig.contractAddress!,
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
    .map((log: any) => ({
      name: log.eventName,
      blockNumber: asNumber(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      args: normalizeLogArgs((log.args || {}) as Record<string, unknown>),
    }))
    .sort((a, b) => a.blockNumber !== b.blockNumber ? a.blockNumber - b.blockNumber : Number(a.logIndex!) - Number(b.logIndex!));

  return {
    gameId: asNumber(gameId),
    fromBlock: asNumber(earliestBlock),
    toBlock: asNumber(latestBlock),
    count: events.length,
    events,
  };
}

function normalizeLogArgs(args: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (/^\d+$/.test(key)) continue;
    normalized[key] = typeof value === 'bigint' ? asNumber(value) : value;
  }
  return normalized;
}

export async function getContractStatus() {
  const [paused, totalGames, automation, fee] = await Promise.all([
    readContract('paused'),
    readContract('totalGames'),
    readContract('getAutomationSettings'),
    readContract('getFeeSettings'),
  ]);

  const automationResult = automation as [boolean, bigint, boolean];
  const feeResult = fee as [boolean, bigint, Address];

  return {
    paused: Boolean(paused),
    totalGames: asNumber(totalGames),
    automation: {
      autoResolveEnabled: Boolean(automationResult[0]),
      autoResolveDelay: asNumber(automationResult[1]),
      requireExternalEntropy: Boolean(automationResult[2]),
    },
    fee: {
      enabled: Boolean(feeResult[0]),
      bps: asNumber(feeResult[1]),
      recipient: feeResult[2],
    },
  };
}
