# Plundrix

A fully on-chain competitive heist game. You and up to 3 rival operatives are locked in a vault room. Five locks stand between you and the score. Pick locks, scrounge for tools, or sabotage your rivals -- first to crack all 5 locks wins. Every round resolves on-chain with no hidden state.

Built on [Lucky Machines Game Core](https://github.com/LuckyMachines/game-core) patterns. Single contract deploy, with optional autoloop and external entropy integrations when you need stronger liveness guarantees.

## Why Play

- **Pure strategy meets chance** -- three simple actions create deep mind-games. Do you pick aggressively, tool up for a big run, or sabotage the leader? Every round is a bet.
- **Fully on-chain** -- game state, randomness, and resolution all happen in one smart contract. No server, no hidden deck, no trust required.
- **Fast games** -- rounds resolve in seconds. A full game takes 5-15 rounds. No long waits, no keeper bots needed.
- **Minimal deployment** -- one contract, one deploy command. No multi-step factory setup, no VRF subscriptions, no off-chain workers.

## The Game

2-4 players compete to be the first to crack all **5 locks** on a vault.

### How It Works

1. **Join** -- players register for an open game (2-4 players)
2. **Each round** -- every player secretly submits one of three actions:
   - **PICK** -- attempt to crack a lock (40% base chance + 15% per tool, max 95%)
   - **SEARCH** -- look for lockpicking tools (60% chance, accumulate up to 5)
   - **SABOTAGE** -- stun a rival and steal one of their tools (always succeeds)
3. **Resolve** -- all actions resolve simultaneously. Picks and searches go first, then sabotages apply stuns for next round.
4. **Win** -- first player to crack all 5 locks wins immediately.

### Key Mechanics

- **Tool stacking** -- each tool adds +15% to your pick chance. With 4 tools you're at 95%. The tension: do you spend rounds searching, or go for picks early?
- **Sabotage & stun** -- sabotaging a player stuns them for one round (PICK auto-fails, SEARCH drops to 30%) and steals a tool. A well-timed sabotage can swing the game.
- **Simultaneous resolution** -- all players act at once, so you can't react to what others do. Read your opponents and commit.
- **Timeout** -- if not all actions are submitted within 5 minutes, the round can be resolved anyway. No stalling.

### At a Glance

| | |
|---|---|
| **Players** | 2-4 per game |
| **Goal** | Crack all 5 locks first |
| **Actions** | Pick, Search, Sabotage |
| **Rounds** | Simultaneous, ~5-15 per game |
| **Randomness** | On-chain pseudo-random (blockhash + keccak256) |
| **Contracts** | 1 (PlundrixGame.sol) |

## Quick Start

```bash
# Build contracts
forge build

# Run local anvil (auto-selects a free port, or set ANVIL_PORT)
npm run anvil

# In another shell, deploy locally (uses ANVIL_RPC_URL if provided)
npm run deploy:local

# One command local play (auto picks free anvil/vite ports, deploys, starts SPA)
npm run play:local

# Stop local play services started by the script
npm run dev:local:stop

# Deploy to Sepolia
forge script script/DeployPlundrix.s.sol --rpc-url sepolia --broadcast

# Run the SPA
cd app && npm install && npm run dev
```

## Import ABI

```js
import PlundrixABI from "./abi/PlundrixGame.json";
```

---

# Architecture Overview

## Contract Diagram

```
┌───────────────────────────────┐
│         PlundrixGame          │  (Single self-contained contract)
│                               │
│  ┌─────────────────────────┐  │
│  │  RBAC (AccessControl)   │  │
│  │  DEFAULT_ADMIN_ROLE     │  │
│  │  GAME_MASTER_ROLE       │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  Game Lifecycle          │  │
│  │  OPEN → ACTIVE → COMPLETE│ │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  Player Registration    │  │
│  │  Built-in (2-4 players) │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  Turn Resolution        │  │
│  │  Pseudo-random (block   │  │
│  │  hash + keccak256)      │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

Plundrix currently ships in a minimal single-contract mode:

- **Single contract** -- self-contained game lifecycle and state
- **On-chain pseudo-randomness** -- uses `keccak256(blockhash, gameID, round, timestamp, optionalEntropy, seed)`
- **Optional autoloop mode** -- `AUTO_RESOLVER_ROLE` can batch resolve timed-out rounds via `resolveTimedOutGames`
- **Optional external entropy mode** -- `RANDOMIZER_ROLE` can provide round entropy via `provideRoundEntropy`
- **No external dependencies** beyond OpenZeppelin

---

# Deployment

```bash
# 1. Create .env at repo root
# PRIVATE_KEY=0x...
# SEPOLIA_RPC_URL=https://...
# ANVIL_RPC_URL=http://127.0.0.1:<anvil-port>   # optional override

# 2a. Deploy to local anvil (default fallback key works out of the box)
# If your anvil is on a non-default port, export ANVIL_RPC_URL first.
npm run deploy:local
# Writes:
# - app/.env.local (VITE_CONTRACT_ADDRESS + VITE_FOUNDRY_RPC_URL)
# - synced ABI files in abi/ and app/src/config/

# 2b. Or deploy to Sepolia
forge script script/DeployPlundrix.s.sol --rpc-url sepolia --broadcast

# 3. Note the deployed contract address from output
```

---

# Frontend

The SPA in `app/` is built with React, Vite, Wagmi, viem, and Tailwind CSS. Dark vault/bunker-themed UI with retro-terminal aesthetics -- uppercase text, monospace data, CRT-style panels.

## Pages

- **`/`** -- Operations Console. Browse all games with status badges (OPEN/ACTIVE/COMPLETE), player counts, and current round. Create new games or join open ones.
- **`/game/:gameId`** -- Routes between three views based on game state:
  - **Lobby** -- Crew manifest showing registered operatives, join and start buttons
  - **Vault Bench** -- Active gameplay interface (see below)
  - **Game Over** -- Final briefing with winner and player stats

## Vault Bench (Active Game)

The main gameplay screen:

- **Lock Rack** -- Visual vault face showing 5 lock states (cracked vs locked) with a progress bar
- **Round Console** -- Current round number, phase indicator, 5-minute timeout dial, and "All Actions In" badge
- **Player Dossiers** -- Compact cards for each operative showing locks cracked (dot indicators), tool count, stun status, and action submission seal
- **Mission Coach** -- Round-aware recommendations and keyboard shortcut hints
- **Action Panel** -- Three-column layout:
  - **Pick** (Set Tension) -- Arc dial showing success chance (40% base + 15% per tool, max 95%, 0% if stunned)
  - **Search** (Sweep Compartment) -- Signal meter showing chance (60% normal, 30% stunned)
  - **Sabotage** (Cut Line) -- Target selector dropdown, always 100% success
- **Resolve Sequence** -- Phased animation after round resolution with truthful `ActionOutcome` reasons (including failed and no-submission outcomes)
- **Replay Timeline** -- Inspect prior resolved rounds and per-player outcome summaries
- **Event Log** -- Real-time feed of on-chain game events

## Contract Integration

The SPA interacts with a single PlundrixGame contract via custom Wagmi hooks. Reads poll at 3-5s intervals (game state, player state, all-actions-submitted checks). Writes handle game creation, registration, action submission, and round resolution, with optional automation/entropy settings support. Gameplay UI now consumes explicit `ActionOutcome` events for accurate round reporting.

## Accessibility and Performance

- **Readable mode toggle** -- larger typography and higher-contrast text for dense HUD readability
- **Low-motion toggle** -- suppresses non-essential animations/transitions
- **Keyboard shortcuts** -- `1` pick, `2` search, `3` sabotage target focus/quick-submit, `R` resolve
- **Code splitting** -- lazy-loaded routes/manual + vendor chunking for faster first paint

## Help System

Built-in Field Manual modal with tabs: Mission Brief, Actions, Equipment, and How to Play.

## Running

```bash
cd app && npm install && npm run dev
```

For local play, start anvil first:

```bash
npm run anvil
```

Or use the all-in-one local play starter:

```bash
npm run play:local
```

`play:local` automatically selects free ports for Anvil and Vite, deploys the contract, writes `app/.env.local`, and prints the app URL.

To stop background local services started by the script:

```bash
npm run dev:local:stop
```

## Environment Variables

```
VITE_RPC_URL                     # Sepolia RPC endpoint (optional, falls back to public)
VITE_WALLETCONNECT_PROJECT_ID    # WalletConnect project ID (optional)
VITE_CONTRACT_ADDRESS            # Deployed PlundrixGame contract address
VITE_FOUNDRY_RPC_URL             # Local anvil RPC (auto-written by deploy/local play scripts)
```

Local deploy automation writes `app/.env.local` for you.

---

# Game Rules

## Actions

Each round, every player submits one of three actions:

| Action | Effect | Success Rate |
|--------|--------|-------------|
| **PICK** | Attempt to crack a lock | Base 40% + 15% per tool held (max 95%). Auto-fails if stunned. |
| **SEARCH** | Look for lockpicking tools | 60% (30% if stunned). Tools accumulate up to max 5. |
| **SABOTAGE** | Target another player | Always succeeds. Stuns target for 1 round. Steals 1 tool if target has any. |

## Win Condition

First player to crack all **5 locks** wins the game.

## Stun Mechanic

- A sabotaged player is **stunned** for the following round
- Stunned players: PICK auto-fails, SEARCH drops to 30% success
- Stun clears after one round of being affected
- Sabotage itself is not affected by stun

## Round Resolution Order

1. **PICK and SEARCH** actions resolve first (using current stun state)
2. **Existing stuns** are cleared
3. **SABOTAGE** actions resolve (applying new stuns for next round, stealing tools)
4. **Winner check** -- if any player has cracked all 5 locks, game ends
5. **Round advances** if no winner

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TOTAL_LOCKS` | 5 | Locks to crack to win |
| `MAX_TOOLS` | 5 | Maximum tools a player can hold |
| `MAX_GAME_PLAYERS` | 4 | Maximum players per game |
| `MIN_GAME_PLAYERS` | 2 | Minimum players to start |
| `ROUND_TIMEOUT` | 5 minutes | Time before round can resolve without all actions |

---

# Game Lifecycle

```
 ┌──────────┐    startGame()    ┌──────────┐    resolveRound()   ┌──────────┐
 │   OPEN   │ ───────────────→  │  ACTIVE  │  ───────────────→  │ COMPLETE │
 └──────────┘                   └──────────┘   (winner found)    └──────────┘
      │                              │
  createGame()                  submitAction()
  registerPlayer()              resolveRound()
                                  (loops until winner)
```

1. **Create** -- Anyone calls `createGame()` to create a new game (state: `OPEN`)
2. **Register** -- Players call `registerPlayer(gameID)` to join (2-4 players)
3. **Start** -- Any registered player (or game master) calls `startGame(gameID)` (state: `OPEN` -> `ACTIVE`)
4. **Play** -- Each round:
   - All players call `submitAction(gameID, action, target)`
   - Anyone calls `resolveRound(gameID)` when all actions are in (or timeout reached)
5. **Win** -- When a player cracks all 5 locks (state: `ACTIVE` → `COMPLETE`)

---

# Function Reference

## Game Lifecycle

### `createGame() → uint256 gameID`

Create a new game. No role required.

### `registerPlayer(uint256 gameID)`

Join an open game. Reverts if game is not `OPEN`, is full, or caller already registered.

### `startGame(uint256 gameID)`

Start the game. Callable by any registered player or `GAME_MASTER_ROLE`. Reverts if fewer than 2 players.

## Player Actions

### `submitAction(uint256 gameID, Action action, address sabotageTarget)`

Submit an action for the current round. Must be a registered player. Each player submits once per round.

- `action`: `1` = PICK, `2` = SEARCH, `3` = SABOTAGE
- `sabotageTarget`: Target address (only checked for SABOTAGE, ignored otherwise)

## Round Resolution

### `resolveRound(uint256 gameID)`

Resolve the current round. Can be called by anyone. Requires either all actions submitted or round timeout reached.

### `configureAutomation(bool autoResolveEnabled, uint256 autoResolveDelay, bool requireExternalEntropy)`

Configure optional autoloop + entropy mode. Callable by `GAME_MASTER_ROLE`.

- `autoResolveEnabled`: enables batch timed-out round resolution flow
- `autoResolveDelay`: minimum seconds from round start before autoloop can resolve (must be `>= ROUND_TIMEOUT`)
- `requireExternalEntropy`: forces `provideRoundEntropy` before round resolution

### `provideRoundEntropy(uint256 gameID, uint256 round, uint256 entropy)`

Inject optional round entropy (for VRF-worker style integrations). Callable by `RANDOMIZER_ROLE`.

### `resolveTimedOutGames(uint256[] gameIDs) -> uint256 resolvedCount`

Batch resolves timed-out games when autoloop is enabled. Callable by `AUTO_RESOLVER_ROLE`.

## View Functions

### `getPlayerState(uint256 gameID, address playerAddr) → (uint256 locksCracked, uint256 tools, bool stunned, bool registered, bool actionSubmitted)`

Get full player state. Returns zeroed values for unregistered addresses.

### `getGameInfo(uint256 gameID) → (GameState state, uint256 currentRound, uint256 playerCount, uint256 roundStartTime, address winner)`

Get high-level game info. `GameState`: `0` = OPEN, `1` = ACTIVE, `2` = COMPLETE.

### `getPlayerAddress(uint256 gameID, uint256 playerIndex) → address`

Get a player's address by 1-based index.

### `allActionsSubmitted(uint256 gameID) → bool`

Check if all players have submitted actions for the current round.

### `canAutoResolve(uint256 gameID) -> bool`

Returns whether the given game currently satisfies autoloop resolution conditions.

### `getAutomationSettings() -> (bool autoResolveEnabled, uint256 autoResolveDelay, bool requireExternalEntropy)`

Returns current automation + entropy mode settings.

### `getRoundEntropy(uint256 gameID, uint256 round) -> uint256`

Returns stored external entropy for a game round (0 means none provided).

### `totalGames() → uint256`

Total number of games created.

---

# Event Reference

| Event | Parameters | When |
|-------|-----------|------|
| `GameCreated` | `gameID`, `creator`, `timeStamp` | New game created |
| `PlayerJoined` | `gameID`, `player`, `playerIndex`, `timeStamp` | Player registered |
| `GameStarted` | `gameID`, `timeStamp` | Game transitioned to ACTIVE |
| `ActionSubmitted` | `gameID`, `player`, `action`, `sabotageTarget`, `round`, `timeStamp` | Player submitted an action |
| `ActionOutcome` | `gameID`, `round`, `player`, `action`, `success`, `reason`, `locksCracked`, `tools`, `stunned`, `sabotageTarget`, `timeStamp` | Per-player truthful round outcome |
| `RoundResolved` | `gameID`, `round`, `timeStamp` | Round finished resolving |
| `RoundAutoResolved` | `gameID`, `round`, `resolver`, `timeStamp` | Round resolved by autoloop worker |
| `LockCracked` | `gameID`, `player`, `totalCracked`, `timeStamp` | Player cracked a lock |
| `ToolFound` | `gameID`, `player`, `totalTools`, `timeStamp` | Player found a tool |
| `PlayerSabotaged` | `gameID`, `attacker`, `victim`, `timeStamp` | Player sabotaged another |
| `PlayerStunned` | `gameID`, `player`, `timeStamp` | Player was stunned |
| `GameWon` | `gameID`, `winner`, `rounds`, `timeStamp` | Player won the game |
| `AutomationSettingsUpdated` | `autoResolveEnabled`, `autoResolveDelay`, `requireExternalEntropy`, `updatedBy`, `timeStamp` | Optional automation settings changed |
| `RoundEntropyProvided` | `gameID`, `round`, `entropy`, `provider`, `timeStamp` | External entropy supplied for a round |

Gameplay events include `gameID` as an indexed parameter for efficient per-game filtering.

---

# Integration Example

```js
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import PlundrixABI from "./abi/PlundrixGame.json";

const PLUNDRIX_ADDRESS = "0x..."; // deployed address

// Read game state
const gameInfo = await publicClient.readContract({
  address: PLUNDRIX_ADDRESS,
  abi: PlundrixABI,
  functionName: "getGameInfo",
  args: [gameID],
});

// Register as a player
await walletClient.writeContract({
  address: PLUNDRIX_ADDRESS,
  abi: PlundrixABI,
  functionName: "registerPlayer",
  args: [gameID],
});

// Submit a PICK action (action enum: 1=PICK, 2=SEARCH, 3=SABOTAGE)
await walletClient.writeContract({
  address: PLUNDRIX_ADDRESS,
  abi: PlundrixABI,
  functionName: "submitAction",
  args: [gameID, 1, "0x0000000000000000000000000000000000000000"],
});

// Submit a SABOTAGE action targeting another player
await walletClient.writeContract({
  address: PLUNDRIX_ADDRESS,
  abi: PlundrixABI,
  functionName: "submitAction",
  args: [gameID, 3, targetPlayerAddress],
});

// Listen for game events
publicClient.watchContractEvent({
  address: PLUNDRIX_ADDRESS,
  abi: PlundrixABI,
  eventName: "LockCracked",
  onLogs: (logs) => {
    console.log("Lock cracked!", logs);
  },
});

// Resolve the round (anyone can call)
await walletClient.writeContract({
  address: PLUNDRIX_ADDRESS,
  abi: PlundrixABI,
  functionName: "resolveRound",
  args: [gameID],
});
```

