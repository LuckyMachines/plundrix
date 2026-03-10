# Plundrix

Plundrix is a fully on-chain competitive vault-heist game. Two to four players race to crack five locks by choosing one action each round: `PICK`, `SEARCH`, or `SABOTAGE`.

The repo currently ships:

- an upgradeable UUPS game contract with pause and role controls
- a React app for local play and Sepolia staging
- an agent/competition service for recommendations, profiles, sessions, badges, and ladders
- KMS-backed deploy and autoloop tooling

## Current Status

- Sepolia staging is live
- current Sepolia proxy: `0x1ff715d46470b4024d88a12838e08a60855f0ae2`
- current Sepolia implementation: `0x6748415bce63c0fbf1e50ceb2128bfeac977224f`
- staging is paused by default
- autoloop is enabled on Sepolia
- external entropy is required on Sepolia
- the 2% fee config exists onchain and is enabled on Sepolia for testing only
- mainnet is not live yet
- planned mainnet posture: free-play beta, no cash prizes, fee config present but disabled

Launch tracking lives in [docs/go-live-checklist.md](docs/go-live-checklist.md).

## Game Summary

- players: `2-4`
- objective: crack all `5` locks first
- actions per round:
  - `PICK`: attempt to crack one lock
  - `SEARCH`: find tools that improve future picks
  - `SABOTAGE`: stun a rival and steal one tool if they have one
- round model: simultaneous submission, then onchain resolution
- timeout: rounds can resolve after `5 minutes` even if not all actions are submitted

## Product Posture

Plundrix is currently documented and staged as:

- free-play
- no cash prizes or monetary rewards live
- agent and bot participation supported
- mainnet planned as a free-play beta, not a prize economy

See [docs/legal-notes.md](docs/legal-notes.md) for the canonical product-claims posture.

## Contract Architecture

`PlundrixGame` is deployed behind an `ERC1967Proxy` using UUPS upgrades.

Key features:

- `DEFAULT_ADMIN_ROLE`, `GAME_MASTER_ROLE`, `PAUSER_ROLE`, `UPGRADER_ROLE`
- optional `AUTO_RESOLVER_ROLE` for timed-out round batching
- optional `RANDOMIZER_ROLE` for external entropy
- `pause()` / `unpause()`
- optional required external entropy mode
- optional autoloop resolution mode
- dormant 2% fee configuration for future paid modes

Important constraint:

- the contract can be upgraded
- the app and integrations should always point at the proxy address, not the implementation

## Repo Layout

- `contracts/` - Solidity contracts
- `script/` - Foundry deploy scripts
- `test/` - Forge and JS tests
- `app/` - React frontend
- `agent-service/` - read/recommendation and competition indexing service
- `ops/` - KMS deploy, funding, and autoloop worker scripts
- `docs/` - runbooks, legal notes, and launch checklist

## Quick Start

```bash
# install JS deps
npm install
cd app && npm install
cd ..

# build contracts
forge build

# start local anvil
npm run anvil

# deploy locally
npm run deploy:local

# start the frontend
cd app && npm run dev
```

Or use the bundled local flow:

```bash
npm run play:local
```

That flow starts anvil, deploys the proxy, writes `app/.env.local`, and starts the frontend.

## Testing

```bash
npm run test:agent
npm run test:sol
npm run test:js

# or everything
npm test
```

## Deployment

### Local

```bash
npm run deploy:local
```

This writes:

- `app/.env.local`
- synced ABI files in `abi/`
- synced ABI files in `app/src/config/`

### Sepolia

```bash
forge script script/DeployPlundrix.s.sol --rpc-url sepolia --broadcast
```

Or the KMS-backed flow:

```bash
npm run deploy:kms
```

### Mainnet

Planned launch posture:

- `START_PAUSED=true`
- `AUTO_RESOLVE_ENABLED=true`
- `AUTO_RESOLVE_DELAY=300`
- `REQUIRE_EXTERNAL_ENTROPY=true`
- fee config deployed but disabled

Runbook:

- [docs/mainnet-runbook.md](docs/mainnet-runbook.md)

Checklist:

- [docs/go-live-checklist.md](docs/go-live-checklist.md)

## Frontend

The app in `app/` is the player-facing UI.

Current staging posture:

- Sepolia-first
- staging copy should say Sepolia is live
- mainnet copy should remain free-play beta until intentionally changed

Frontend env vars:

```bash
VITE_RPC_URL
VITE_WALLETCONNECT_PROJECT_ID
VITE_CONTRACT_ADDRESS
VITE_AGENT_SERVICE_URL
VITE_FOUNDRY_RPC_URL
VITE_ENABLE_FOUNDRY
```

Run:

```bash
cd app
npm run dev
```

Build:

```bash
cd app
npm run build
```

## Agent Service

The optional service in `agent-service/` provides:

- normalized game snapshots
- per-player available-actions reads
- history endpoints
- recommendation endpoint
- competition overview
- leaderboard and agent-ladder endpoints
- profiles, badges, and recent sessions

Run:

```bash
npm run agent:start
```

More detail:

- [agent-service/README.md](agent-service/README.md)

## Main Operational Commands

```bash
npm run kms:address
npm run kms:fund
npm run deploy:kms
npm run autoloop:start
```

## Game Rules

### Action Outcomes

| Action | Effect | Success |
| --- | --- | --- |
| `PICK` | Attempt to crack a lock | `40%` base + `15%` per tool, max `95%`; auto-fails if stunned |
| `SEARCH` | Look for tools | `60%`; `30%` if stunned |
| `SABOTAGE` | Stun a rival and steal one tool if available | always succeeds |

### Constants

| Constant | Value |
| --- | --- |
| `TOTAL_LOCKS` | `5` |
| `MAX_TOOLS` | `5` |
| `MIN_GAME_PLAYERS` | `2` |
| `MAX_GAME_PLAYERS` | `4` |
| `ROUND_TIMEOUT` | `5 minutes` |

### Win Condition

First player to crack all five locks wins immediately.

## Contract Surface

Core mutating functions:

- `createGame()`
- `registerPlayer(uint256 gameId)`
- `startGame(uint256 gameId)`
- `submitAction(uint256 gameId, Action action, address sabotageTarget)`
- `resolveRound(uint256 gameId)`

Operational/admin functions:

- `pause()`
- `unpause()`
- `configureAutomation(...)`
- `provideRoundEntropy(...)`
- `resolveTimedOutGames(...)`
- `configureFee(...)`

Useful views:

- `getGameInfo(...)`
- `getPlayerState(...)`
- `allActionsSubmitted(...)`
- `getAutomationSettings()`
- `getFeeSettings()`
- `previewFee(...)`
- `getRoundEntropy(...)`
- `totalGames()`

## Additional Docs

- [docs/go-live-checklist.md](docs/go-live-checklist.md)
- [docs/mainnet-runbook.md](docs/mainnet-runbook.md)
- [docs/legal-notes.md](docs/legal-notes.md)
