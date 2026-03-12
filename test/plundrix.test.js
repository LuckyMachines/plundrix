import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  encodeFunctionData,
  parseEventLogs,
  zeroAddress,
} from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const artifact = JSON.parse(
  readFileSync(
    resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'),
    'utf8'
  )
);
const abi = artifact.abi;
const bytecode = artifact.bytecode.object;
const proxyArtifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      'out',
      'ERC1967Proxy.sol',
      'ERC1967Proxy.json'
    ),
    'utf8'
  )
);
const proxyBytecode = proxyArtifact.bytecode.object;

const ANVIL_PORT = Number(process.env.TEST_ANVIL_PORT || 19645);
const RPC_URL = `http://127.0.0.1:${ANVIL_PORT}`;

// Anvil default pre-funded accounts
const keys = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
];

// Action enum values
const PICK = 1;
const SEARCH = 2;
const SABOTAGE = 3;
const ACTION_NONE = 0;
const OUTCOME_NO_SUBMISSION = 11;
const DEFAULT_ADMIN = 0;
const GAME_MASTER = 1;
const PAUSER = 2;
const UPGRADER = 3;
const OPERATOR = 4;

let anvilProcess;
let publicClient;
let testClient;
let wallets;
let contractAddress;
let implementationAddress;

function startAnvil() {
  return new Promise((resolvePromise, reject) => {
    anvilProcess = spawn('anvil', ['--port', String(ANVIL_PORT)], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    const onData = (data) => {
      output += data.toString();
      if (output.includes('Listening on')) {
        resolvePromise();
      }
    };

    anvilProcess.stdout.on('data', onData);
    anvilProcess.stderr.on('data', onData);
    anvilProcess.on('error', reject);

    setTimeout(() => reject(new Error('Anvil startup timeout')), 15000);
  });
}

// --- Helpers ---

async function deploy() {
  const implementationHash = await wallets[0].deployContract({
    abi,
    bytecode,
  });
  const implementationReceipt = await publicClient.waitForTransactionReceipt({
    hash: implementationHash,
  });
  implementationAddress = implementationReceipt.contractAddress;

  const initData = encodeFunctionData({
    abi,
    functionName: 'initialize',
    args: [
      {
        defaultAdmin: addr(DEFAULT_ADMIN),
        gameMaster: addr(GAME_MASTER),
        pauser: addr(PAUSER),
        upgrader: addr(UPGRADER),
        autoResolver: addr(OPERATOR),
        randomizer: addr(OPERATOR),
        startPaused: false,
      },
    ],
  });

  const proxyHash = await wallets[0].deployContract({
    abi: proxyArtifact.abi,
    bytecode: proxyBytecode,
    args: [implementationAddress, initData],
  });
  const proxyReceipt = await publicClient.waitForTransactionReceipt({
    hash: proxyHash,
  });
  return proxyReceipt.contractAddress;
}

async function exec(walletIndex, functionName, args = []) {
  const hash = await wallets[walletIndex].writeContract({
    address: contractAddress,
    abi,
    functionName,
    args,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

async function execWithValue(walletIndex, functionName, args = [], value = 0n) {
  const hash = await wallets[walletIndex].writeContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    value,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

async function read(functionName, args = []) {
  return publicClient.readContract({
    address: contractAddress,
    abi,
    functionName,
    args,
  });
}

function getEvents(receipt, eventName) {
  return parseEventLogs({ abi, logs: receipt.logs, eventName });
}

async function setupGame(playerWalletIndices) {
  const receipt = await exec(GAME_MASTER, 'createGame');
  const events = getEvents(receipt, 'GameCreated');
  const gameId = events[0].args.gameID;

  for (const i of playerWalletIndices) {
    await exec(i, 'registerPlayer', [gameId]);
  }

  await exec(GAME_MASTER, 'startGame', [gameId]);
  return gameId;
}

function addr(walletIndex) {
  return wallets[walletIndex].account.address;
}

// --- Test Suite ---

describe('PlundrixGame', () => {
  beforeAll(async () => {
    await startAnvil();

    publicClient = createPublicClient({
      chain: foundry,
      transport: http(RPC_URL),
    });

    testClient = createTestClient({
      chain: foundry,
      transport: http(RPC_URL),
      mode: 'anvil',
    });

    wallets = keys.map((key) =>
      createWalletClient({
        account: privateKeyToAccount(key),
        chain: foundry,
        transport: http(RPC_URL),
      })
    );

    contractAddress = await deploy();
  });

  afterAll(() => {
    if (anvilProcess) anvilProcess.kill();
  });

  // --- Deployment ---

  describe('deployment', () => {
    it('has zero total games initially', async () => {
      const total = await read('totalGames');
      expect(total).toBe(0n);
    });

    it('locks the implementation initializer', async () => {
      await expect(
        wallets[0].writeContract({
          address: implementationAddress,
          abi,
          functionName: 'initialize',
          args: [
            {
              defaultAdmin: addr(DEFAULT_ADMIN),
              gameMaster: addr(GAME_MASTER),
              pauser: addr(PAUSER),
              upgrader: addr(UPGRADER),
              autoResolver: addr(OPERATOR),
              randomizer: addr(OPERATOR),
              startPaused: false,
            },
          ],
        })
      ).rejects.toThrow(/already initialized/);
    });

    it('deployer has DEFAULT_ADMIN_ROLE', async () => {
      const role = await read('DEFAULT_ADMIN_ROLE');
      const has = await read('hasRole', [role, addr(DEFAULT_ADMIN)]);
      expect(has).toBe(true);
    });

    it('configured game master has GAME_MASTER_ROLE', async () => {
      const role = await read('GAME_MASTER_ROLE');
      const has = await read('hasRole', [role, addr(GAME_MASTER)]);
      expect(has).toBe(true);
    });

    it('configured operator has AUTO_RESOLVER_ROLE', async () => {
      const role = await read('AUTO_RESOLVER_ROLE');
      const has = await read('hasRole', [role, addr(OPERATOR)]);
      expect(has).toBe(true);
    });

    it('configured operator has RANDOMIZER_ROLE', async () => {
      const role = await read('RANDOMIZER_ROLE');
      const has = await read('hasRole', [role, addr(OPERATOR)]);
      expect(has).toBe(true);
    });

    it('default admin does not implicitly get GAME_MASTER_ROLE', async () => {
      const role = await read('GAME_MASTER_ROLE');
      const has = await read('hasRole', [role, addr(DEFAULT_ADMIN)]);
      expect(has).toBe(false);
    });

    it('automation settings default to disabled', async () => {
      const settings = await read('getAutomationSettings');
      expect(settings[0]).toBe(false);
      expect(settings[1]).toBe(300n);
      expect(settings[2]).toBe(false);
    });

    it('fee settings default to disabled at 2%', async () => {
      const settings = await read('getFeeSettings');
      expect(settings[0]).toBe(false);
      expect(settings[1]).toBe(200n);
      expect(settings[2]).toBe(addr(DEFAULT_ADMIN));
    });
  });

  // --- Constants ---

  describe('constants', () => {
    it('TOTAL_LOCKS is 5', async () => {
      expect(await read('TOTAL_LOCKS')).toBe(5n);
    });

    it('MAX_TOOLS is 5', async () => {
      expect(await read('MAX_TOOLS')).toBe(5n);
    });

    it('MAX_GAME_PLAYERS is 4', async () => {
      expect(await read('MAX_GAME_PLAYERS')).toBe(4n);
    });

    it('MIN_GAME_PLAYERS is 2', async () => {
      expect(await read('MIN_GAME_PLAYERS')).toBe(2n);
    });

    it('ROUND_TIMEOUT is 300 (5 minutes)', async () => {
      expect(await read('ROUND_TIMEOUT')).toBe(300n);
    });
  });

  // --- Game Creation & Registration ---

  describe('game creation and registration', () => {
    let gameId;

    it('creates a game and emits GameCreated', async () => {
      const receipt = await exec(GAME_MASTER, 'createGame');
      const events = getEvents(receipt, 'GameCreated');
      expect(events.length).toBe(1);
      gameId = events[0].args.gameID;
      expect(gameId).toBe(1n);
      expect(events[0].args.creator).toBe(addr(GAME_MASTER));
    });

    it('increments totalGames', async () => {
      expect(await read('totalGames')).toBe(1n);
    });

    it('game starts in OPEN state', async () => {
      const info = await read('getGameInfo', [gameId]);
      expect(Number(info[0])).toBe(0); // OPEN
      expect(info[2]).toBe(0n); // playerCount
    });

    it('registers player and emits PlayerJoined', async () => {
      const receipt = await exec(1, 'registerPlayer', [gameId]);
      const events = getEvents(receipt, 'PlayerJoined');
      expect(events.length).toBe(1);
      expect(events[0].args.player).toBe(addr(1));
      expect(events[0].args.playerIndex).toBe(1n);
    });

    it('rejects duplicate registration', async () => {
      await expect(exec(1, 'registerPlayer', [gameId])).rejects.toThrow(
        /Already registered/
      );
    });

    it('registers additional players', async () => {
      await exec(2, 'registerPlayer', [gameId]);
      await exec(3, 'registerPlayer', [gameId]);
      await exec(4, 'registerPlayer', [gameId]);
      const info = await read('getGameInfo', [gameId]);
      expect(info[2]).toBe(4n); // playerCount
    });

    it('rejects 5th player (game full)', async () => {
      await expect(exec(0, 'registerPlayer', [gameId])).rejects.toThrow(
        /Game is full/
      );
    });

    it('getPlayerAddress returns correct addresses', async () => {
      expect(await read('getPlayerAddress', [gameId, 1n])).toBe(addr(1));
      expect(await read('getPlayerAddress', [gameId, 2n])).toBe(addr(2));
      expect(await read('getPlayerAddress', [gameId, 3n])).toBe(addr(3));
      expect(await read('getPlayerAddress', [gameId, 4n])).toBe(addr(4));
    });

    it('getPlayerState shows registered with zero progress', async () => {
      const state = await read('getPlayerState', [gameId, addr(1)]);
      expect(state[0]).toBe(0n); // locksCracked
      expect(state[1]).toBe(0n); // tools
      expect(state[2]).toBe(false); // stunned
      expect(state[3]).toBe(true); // registered
      expect(state[4]).toBe(false); // actionSubmitted
    });

    it('getPlayerState returns zeroes for non-player', async () => {
      const state = await read('getPlayerState', [gameId, addr(0)]);
      expect(state[3]).toBe(false); // not registered
    });
  });

  // --- Game Existence Validation ---

  describe('game existence validation', () => {
    let nonExistentGameId;

    beforeAll(async () => {
      const total = await read('totalGames');
      nonExistentGameId = total + 1n;
    });

    it('rejects registerPlayer on non-existent game', async () => {
      await expect(exec(1, 'registerPlayer', [nonExistentGameId])).rejects.toThrow(
        /Game does not exist/
      );
    });

    it('rejects startGame on non-existent game', async () => {
      await expect(exec(GAME_MASTER, 'startGame', [nonExistentGameId])).rejects.toThrow(
        /Game does not exist/
      );
    });

    it('rejects submitAction on non-existent game', async () => {
      await expect(
        exec(1, 'submitAction', [nonExistentGameId, PICK, zeroAddress])
      ).rejects.toThrow(/Game does not exist/);
    });

    it('rejects resolveRound on non-existent game', async () => {
      await expect(exec(0, 'resolveRound', [nonExistentGameId])).rejects.toThrow(
        /Game does not exist/
      );
    });

    it('rejects getGameInfo on non-existent game', async () => {
      await expect(read('getGameInfo', [nonExistentGameId])).rejects.toThrow(
        /Game does not exist/
      );
    });
  });

  // --- Game Start ---

  describe('game start', () => {
    let gameId;

    beforeAll(async () => {
      const receipt = await exec(GAME_MASTER, 'createGame');
      gameId = getEvents(receipt, 'GameCreated')[0].args.gameID;
      await exec(1, 'registerPlayer', [gameId]);
      await exec(2, 'registerPlayer', [gameId]);
    });

    it('rejects start from unregistered non-GM account', async () => {
      await expect(exec(3, 'startGame', [gameId])).rejects.toThrow(
        /Not authorized to start/
      );
    });

    it('rejects start with fewer than 2 players', async () => {
      const r = await exec(GAME_MASTER, 'createGame');
      const soloId = getEvents(r, 'GameCreated')[0].args.gameID;
      await exec(1, 'registerPlayer', [soloId]);
      await expect(exec(GAME_MASTER, 'startGame', [soloId])).rejects.toThrow(
        /Not enough players/
      );
    });

    it('starts the game from a registered non-GM account', async () => {
      const receipt = await exec(1, 'startGame', [gameId]);
      const events = getEvents(receipt, 'GameStarted');
      expect(events.length).toBe(1);
      expect(events[0].args.gameID).toBe(gameId);
    });

    it('game is ACTIVE at round 1', async () => {
      const info = await read('getGameInfo', [gameId]);
      expect(Number(info[0])).toBe(1); // ACTIVE
      expect(info[1]).toBe(1n); // currentRound
    });

    it('rejects registration on active game', async () => {
      await expect(exec(3, 'registerPlayer', [gameId])).rejects.toThrow(
        /Game not open/
      );
    });

    it('rejects starting an already active game', async () => {
      await expect(exec(DEFAULT_ADMIN, 'startGame', [gameId])).rejects.toThrow(
        /Game not open/
      );
    });
  });

  // --- Action Submission & Round Resolution ---

  describe('action submission and round resolution', () => {
    let gameId;

    beforeAll(async () => {
      gameId = await setupGame([1, 2]);
    });

    it('submits PICK and emits ActionSubmitted', async () => {
      const receipt = await exec(1, 'submitAction', [gameId, PICK, zeroAddress]);
      const events = getEvents(receipt, 'ActionSubmitted');
      expect(events.length).toBe(1);
      expect(events[0].args.player).toBe(addr(1));
      expect(Number(events[0].args.action)).toBe(PICK);
      expect(events[0].args.round).toBe(1n);
    });

    it('player state shows actionSubmitted = true', async () => {
      const state = await read('getPlayerState', [gameId, addr(1)]);
      expect(state[4]).toBe(true); // actionSubmitted
    });

    it('rejects duplicate action in same round', async () => {
      await expect(
        exec(1, 'submitAction', [gameId, SEARCH, zeroAddress])
      ).rejects.toThrow(/Action already submitted/);
    });

    it('allActionsSubmitted is false with one pending', async () => {
      expect(await read('allActionsSubmitted', [gameId])).toBe(false);
    });

    it('rejects resolve when not all submitted and timeout not reached', async () => {
      await expect(exec(0, 'resolveRound', [gameId])).rejects.toThrow();
    });

    it('rejects action from non-player', async () => {
      await expect(
        exec(0, 'submitAction', [gameId, PICK, zeroAddress])
      ).rejects.toThrow(/Not a registered player/);
    });

    it('submits second player action', async () => {
      await exec(2, 'submitAction', [gameId, SEARCH, zeroAddress]);
    });

    it('allActionsSubmitted is true', async () => {
      expect(await read('allActionsSubmitted', [gameId])).toBe(true);
    });

    it('resolves round and emits RoundResolved', async () => {
      const receipt = await exec(0, 'resolveRound', [gameId]);
      const events = getEvents(receipt, 'RoundResolved');
      expect(events.length).toBe(1);
      expect(events[0].args.round).toBe(1n);
    });

    it('advances to round 2', async () => {
      const info = await read('getGameInfo', [gameId]);
      if (Number(info[0]) === 1) {
        expect(info[1]).toBe(2n);
      }
    });

    it('clears pending actions after resolution', async () => {
      const state = await read('getPlayerState', [gameId, addr(1)]);
      expect(state[4]).toBe(false); // actionSubmitted cleared
    });
  });

  // --- Input Validation ---

  describe('input validation', () => {
    let gameId;

    beforeAll(async () => {
      gameId = await setupGame([1, 2]);
    });

    it('rejects NONE action (enum value 0)', async () => {
      await expect(
        exec(1, 'submitAction', [gameId, 0, zeroAddress])
      ).rejects.toThrow(/Invalid action/);
    });

    it('rejects self-sabotage', async () => {
      await expect(
        exec(1, 'submitAction', [gameId, SABOTAGE, addr(1)])
      ).rejects.toThrow(/Cannot sabotage yourself/);
    });

    it('rejects sabotage targeting non-player', async () => {
      await expect(
        exec(1, 'submitAction', [gameId, SABOTAGE, addr(0)])
      ).rejects.toThrow(/Target not in game/);
    });

    it('accepts valid sabotage targeting another player', async () => {
      const receipt = await exec(1, 'submitAction', [gameId, SABOTAGE, addr(2)]);
      const events = getEvents(receipt, 'ActionSubmitted');
      expect(events.length).toBe(1);
    });
  });

  // --- Stun Mechanics & Tool Theft ---

  describe('stun mechanics and tool theft', () => {
    let gameId;

    beforeAll(async () => {
      gameId = await setupGame([1, 2]);

      // Both players SEARCH until Player 2 has at least 1 tool
      let p2Tools = 0n;
      let rounds = 0;
      while (p2Tools === 0n && rounds < 50) {
        await exec(1, 'submitAction', [gameId, SEARCH, zeroAddress]);
        await exec(2, 'submitAction', [gameId, SEARCH, zeroAddress]);
        await exec(0, 'resolveRound', [gameId]);
        const state = await read('getPlayerState', [gameId, addr(2)]);
        p2Tools = state[1];
        rounds++;
      }
    });

    it('player 2 has tools from searching', async () => {
      const state = await read('getPlayerState', [gameId, addr(2)]);
      expect(state[1]).toBeGreaterThan(0n);
    });

    it('sabotage stuns target, steals a tool, and emits events', async () => {
      const p1Before = await read('getPlayerState', [gameId, addr(1)]);
      const p2Before = await read('getPlayerState', [gameId, addr(2)]);

      // Player 1 SABOTAGEs Player 2, Player 2 PICKs
      await exec(1, 'submitAction', [gameId, SABOTAGE, addr(2)]);
      await exec(2, 'submitAction', [gameId, PICK, zeroAddress]);
      const receipt = await exec(0, 'resolveRound', [gameId]);

      // Verify events
      const sabotageEvents = getEvents(receipt, 'PlayerSabotaged');
      expect(sabotageEvents.length).toBe(1);
      expect(sabotageEvents[0].args.attacker).toBe(addr(1));
      expect(sabotageEvents[0].args.victim).toBe(addr(2));

      const stunEvents = getEvents(receipt, 'PlayerStunned');
      expect(stunEvents.length).toBe(1);
      expect(stunEvents[0].args.player).toBe(addr(2));

      // Verify tool theft
      const p1After = await read('getPlayerState', [gameId, addr(1)]);
      const p2After = await read('getPlayerState', [gameId, addr(2)]);
      expect(p1After[1]).toBe(p1Before[1] + 1n); // gained 1 tool
      expect(p2After[1]).toBe(p2Before[1] - 1n); // lost 1 tool

      // Verify stun applied
      expect(p2After[2]).toBe(true);
    });

    it('stunned player PICK auto-fails', async () => {
      // Confirm Player 2 is stunned
      const p2Before = await read('getPlayerState', [gameId, addr(2)]);
      expect(p2Before[2]).toBe(true);
      const locksBefore = p2Before[0];

      // Player 2 PICKs while stunned (should auto-fail)
      await exec(1, 'submitAction', [gameId, SEARCH, zeroAddress]);
      await exec(2, 'submitAction', [gameId, PICK, zeroAddress]);
      await exec(0, 'resolveRound', [gameId]);

      const p2After = await read('getPlayerState', [gameId, addr(2)]);
      expect(p2After[0]).toBe(locksBefore); // locksCracked unchanged
    });

    it('stun clears after one round', async () => {
      const state = await read('getPlayerState', [gameId, addr(2)]);
      expect(state[2]).toBe(false); // no longer stunned
    });
  });

  // --- Timeout Resolution ---

  describe('timeout resolution', () => {
    let gameId;

    beforeAll(async () => {
      gameId = await setupGame([1, 2]);
    });

    it('rejects resolve before timeout when not all submitted', async () => {
      await exec(1, 'submitAction', [gameId, PICK, zeroAddress]);
      await expect(exec(0, 'resolveRound', [gameId])).rejects.toThrow();
    });

    it('resolves after ROUND_TIMEOUT with partial submissions', async () => {
      // Advance time past 5-minute timeout
      await testClient.increaseTime({ seconds: 301 });
      await testClient.mine({ blocks: 1 });

      const receipt = await exec(0, 'resolveRound', [gameId]);
      const events = getEvents(receipt, 'RoundResolved');
      expect(events.length).toBe(1);
      expect(events[0].args.round).toBe(1n);

      const outcomes = getEvents(receipt, 'ActionOutcome');
      expect(outcomes.length).toBe(2);
      const missingPlayer = outcomes.find((e) => e.args.player === addr(2));
      expect(missingPlayer).toBeDefined();
      // AFK player now gets default PICK instead of NO_SUBMISSION
      expect(Number(missingPlayer.args.action)).toBe(PICK);
    });

    it('non-submitting player is unaffected (no crash)', async () => {
      // Player 2 did not submit in round 1 but game should still advance
      const info = await read('getGameInfo', [gameId]);
      expect(Number(info[0])).toBe(1); // still ACTIVE
      expect(info[1]).toBe(2n); // round 2
    });
  });

  // --- Optional Automation / Entropy ---

  describe('automation and entropy modes', () => {
    let gameId;

    beforeAll(async () => {
      gameId = await setupGame([1, 2]);
    });

    afterAll(async () => {
      await exec(GAME_MASTER, 'configureAutomation', [false, 300n, false]);
    });

    it('updates automation settings', async () => {
      await exec(GAME_MASTER, 'configureAutomation', [true, 300n, false]);
      const settings = await read('getAutomationSettings');
      expect(settings[0]).toBe(true);
      expect(settings[1]).toBe(300n);
      expect(settings[2]).toBe(false);
    });

    it('can batch auto-resolve timed out games', async () => {
      await exec(1, 'submitAction', [gameId, PICK, zeroAddress]);

      await testClient.increaseTime({ seconds: 301 });
      await testClient.mine({ blocks: 1 });

      expect(await read('canAutoResolve', [gameId])).toBe(true);

      const receipt = await exec(OPERATOR, 'resolveTimedOutGames', [[gameId]]);
      const autoEvents = getEvents(receipt, 'RoundAutoResolved');
      expect(autoEvents.length).toBe(1);
      expect(autoEvents[0].args.gameID).toBe(gameId);
      expect(autoEvents[0].args.resolver).toBe(addr(OPERATOR));
    });

    it('requires entropy when external entropy mode is enabled', async () => {
      const entropyGameId = await setupGame([1, 2]);

      await exec(GAME_MASTER, 'configureAutomation', [false, 300n, true]);
      await exec(1, 'submitAction', [entropyGameId, PICK, zeroAddress]);
      await exec(2, 'submitAction', [entropyGameId, SEARCH, zeroAddress]);

      await expect(exec(0, 'resolveRound', [entropyGameId])).rejects.toThrow(
        /Entropy not ready/
      );

      await exec(OPERATOR, 'provideRoundEntropy', [entropyGameId, 1n, 9999n]);
      const receipt = await exec(0, 'resolveRound', [entropyGameId]);
      const resolved = getEvents(receipt, 'RoundResolved');
      expect(resolved.length).toBe(1);
    });
  });

  describe('pause controls', () => {
    it('admin can pause and unpause', async () => {
      await exec(PAUSER, 'pause');
      expect(await read('paused')).toBe(true);

      await expect(exec(1, 'createGame')).rejects.toThrow(/Pausable: paused/);

      await exec(PAUSER, 'unpause');
      expect(await read('paused')).toBe(false);
    });

    it('game master can configure dormant fee while paused', async () => {
      await exec(PAUSER, 'pause');
      await exec(GAME_MASTER, 'configureFee', [true, addr(DEFAULT_ADMIN)]);

      const settings = await read('getFeeSettings');
      expect(settings[0]).toBe(true);
      expect(settings[1]).toBe(200n);
      expect(settings[2]).toBe(addr(DEFAULT_ADMIN));

      const preview = await read('previewFee', [10000n]);
      expect(preview[0]).toBe(200n);
      expect(preview[1]).toBe(9800n);

      await exec(GAME_MASTER, 'configureFee', [false, addr(DEFAULT_ADMIN)]);
      await exec(PAUSER, 'unpause');
    });

    it('non-pauser cannot pause', async () => {
      await expect(exec(1, 'pause')).rejects.toThrow(/is missing role/);
    });
  });

  // --- Full Game Playthrough ---

  describe('full game playthrough', () => {
    it('plays until a winner is found', async () => {
      const gameId = await setupGame([1, 2]);

      let gameState = 1; // ACTIVE
      let round = 0;
      let lastReceipt;

      while (gameState === 1 && round < 100) {
        await exec(1, 'submitAction', [gameId, PICK, zeroAddress]);
        await exec(2, 'submitAction', [gameId, PICK, zeroAddress]);
        lastReceipt = await exec(0, 'resolveRound', [gameId]);
        round++;

        const info = await read('getGameInfo', [gameId]);
        gameState = Number(info[0]);
      }

      // With 40% success per PICK over 100 rounds, a win is virtually certain
      expect(gameState).toBe(2); // COMPLETE

      // Verify GameWon event on the winning round
      const wonEvents = getEvents(lastReceipt, 'GameWon');
      expect(wonEvents.length).toBe(1);

      // Winner is one of the two players
      const info = await read('getGameInfo', [gameId]);
      const winner = info[4];
      expect(winner === addr(1) || winner === addr(2)).toBe(true);

      // Winner has >= 5 locks cracked
      const winnerState = await read('getPlayerState', [gameId, winner]);
      expect(winnerState[0]).toBeGreaterThanOrEqual(5n);
    });

    it('rejects actions on completed game', async () => {
      // Find a completed game
      const total = await read('totalGames');
      let completedGameId;
      for (let i = 1n; i <= total; i++) {
        const info = await read('getGameInfo', [i]);
        if (Number(info[0]) === 2) {
          completedGameId = i;
          break;
        }
      }
      expect(completedGameId).toBeDefined();

      await expect(
        exec(1, 'submitAction', [completedGameId, PICK, zeroAddress])
      ).rejects.toThrow(/Game not active/);
    });
  });

  // --- Stakes Mode ---

  describe('stakes mode', () => {
    const ENTRY_FEE = 10000000000000000n; // 0.01 ETH
    let gameId;

    beforeAll(async () => {
      // Enable fee collection before creating stakes games
      await exec(GAME_MASTER, 'configureFee', [true, addr(DEFAULT_ADMIN)]);
    });

    afterAll(async () => {
      await exec(GAME_MASTER, 'configureFee', [false, addr(DEFAULT_ADMIN)]);
    });

    it('creates a STAKES game with entry fee', async () => {
      const receipt = await exec(GAME_MASTER, 'createGame', [1, ENTRY_FEE]);
      const events = getEvents(receipt, 'GameCreated');
      expect(events.length).toBe(1);
      gameId = events[0].args.gameID;
    });

    it('getGameMode returns correct mode, entryFee, and initial pot', async () => {
      const mode = await read('getGameMode', [gameId]);
      expect(Number(mode[0])).toBe(1); // STAKES
      expect(mode[1]).toBe(ENTRY_FEE);
      expect(mode[2]).toBe(0n); // pot starts at 0
    });

    it('registers players with exact entry fee', async () => {
      await execWithValue(1, 'registerPlayer', [gameId], ENTRY_FEE);
      await execWithValue(2, 'registerPlayer', [gameId], ENTRY_FEE);
      const info = await read('getGameInfo', [gameId]);
      expect(info[2]).toBe(2n);
    });

    it('pot accumulates entry fees', async () => {
      const mode = await read('getGameMode', [gameId]);
      expect(mode[2]).toBe(ENTRY_FEE * 2n);
    });

    it('plays stakes game to completion and winner can withdraw', async () => {
      await exec(GAME_MASTER, 'startGame', [gameId]);

      let gameState = 1;
      let round = 0;

      while (gameState === 1 && round < 100) {
        await exec(1, 'submitAction', [gameId, PICK, zeroAddress]);
        await exec(2, 'submitAction', [gameId, PICK, zeroAddress]);
        await exec(0, 'resolveRound', [gameId]);
        round++;

        const info = await read('getGameInfo', [gameId]);
        gameState = Number(info[0]);
      }

      expect(gameState).toBe(2); // COMPLETE

      const info = await read('getGameInfo', [gameId]);
      const winner = info[4];
      expect(winner === addr(1) || winner === addr(2)).toBe(true);

      // Winner should have withdrawable balance (pot minus 2% fee)
      const winnerIndex = winner === addr(1) ? 1 : 2;
      const balance = await read('withdrawableBalance', [winner]);
      const expectedPrize = (ENTRY_FEE * 2n * 98n) / 100n; // 2% fee
      expect(balance).toBe(expectedPrize);

      // Withdraw
      const receipt = await exec(winnerIndex, 'withdraw');
      expect(receipt.status).toBe('success');

      // Balance should be zero after withdrawal
      const balanceAfter = await read('withdrawableBalance', [winner]);
      expect(balanceAfter).toBe(0n);
    });
  });

  // --- Default Move for AFK Players ---

  describe('default move for AFK players', () => {
    let gameId;

    beforeAll(async () => {
      gameId = await setupGame([1, 2]);
    });

    it('AFK player gets default PICK move on timeout instead of NO_SUBMISSION', async () => {
      // Only player 1 submits
      await exec(1, 'submitAction', [gameId, SEARCH, zeroAddress]);

      // Advance past timeout
      await testClient.increaseTime({ seconds: 301 });
      await testClient.mine({ blocks: 1 });

      const receipt = await exec(0, 'resolveRound', [gameId]);
      const outcomes = getEvents(receipt, 'ActionOutcome');
      expect(outcomes.length).toBe(2);

      // Find the AFK player's outcome
      const afkOutcome = outcomes.find((e) => e.args.player === addr(2));
      expect(afkOutcome).toBeDefined();
      // AFK player should get PICK (1) as default action, not ACTION_NONE (0)
      expect(Number(afkOutcome.args.action)).toBe(PICK);
    });

    it('game advances normally after AFK default move', async () => {
      const info = await read('getGameInfo', [gameId]);
      expect(Number(info[0])).toBe(1); // still ACTIVE
      expect(info[1]).toBe(2n); // round 2
    });
  });

  // --- Free Game Rejects ETH ---

  describe('free game rejects ETH', () => {
    let gameId;

    beforeAll(async () => {
      const receipt = await exec(GAME_MASTER, 'createGame');
      gameId = getEvents(receipt, 'GameCreated')[0].args.gameID;
    });

    it('reverts when registering with ETH on a free game', async () => {
      await expect(
        execWithValue(1, 'registerPlayer', [gameId], 10000000000000000n)
      ).rejects.toThrow();
    });
  });

  // --- Stakes Game Rejects Wrong Fee ---

  describe('stakes game rejects wrong fee', () => {
    const ENTRY_FEE = 10000000000000000n; // 0.01 ETH
    const WRONG_FEE = 5000000000000000n; // 0.005 ETH
    let gameId;

    beforeAll(async () => {
      await exec(GAME_MASTER, 'configureFee', [true, addr(DEFAULT_ADMIN)]);
      const receipt = await exec(GAME_MASTER, 'createGame', [1, ENTRY_FEE]);
      gameId = getEvents(receipt, 'GameCreated')[0].args.gameID;
    });

    afterAll(async () => {
      await exec(GAME_MASTER, 'configureFee', [false, addr(DEFAULT_ADMIN)]);
    });

    it('reverts when registering with incorrect entry fee', async () => {
      await expect(
        execWithValue(1, 'registerPlayer', [gameId], WRONG_FEE)
      ).rejects.toThrow();
    });

    it('reverts when registering with zero value on stakes game', async () => {
      await expect(
        exec(1, 'registerPlayer', [gameId])
      ).rejects.toThrow();
    });
  });
});
