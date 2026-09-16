# Plundrix Agent Service

This is the authoritative game-service boundary for the public Plundrix app. It owns anonymous player sessions, derives server-custodied game accounts, sponsors bounded commands, and returns ordinary game-shaped JSON. The browser never receives an address, key, network name, transaction hash, RPC URL, or signing request.

Its public managed-play surface provides:

- opaque signed sessions in `HttpOnly`, `SameSite=Lax` cookies
- live operation discovery, creation, joining, starting, and actions
- persistent workshop reads, crafting, equipping, and reclaiming
- conservative fee, command, daily budget, and reserve gates
- serialized writes so account nonces cannot race
- sanitized player identities, operation state, and errors

It also provides:

- normalized game snapshot endpoint
- available-actions endpoint for a specific player
- recent history endpoint
- heuristic recommendation endpoint
- season overview and leaderboard endpoints
- profile, badges, and recent-session endpoints
- explicit queue segmentation for open tables, mixed tables, and agent ladders

Managed play is opt-in and fails closed unless every required server-only credential and address is configured. Raw address-bearing API routes and the older session relay are disabled by default.

The service is also the current indexing layer for:

- season overview
- leaderboards
- explicit agent ladders
- profile summaries
- badges
- recent sessions

## Current Network Posture

- staging network: Sepolia
- current staging proxy: `0x1ff715d46470b4024d88a12838e08a60855f0ae2`
- mainnet is not live yet
- expected mainnet launch posture: free-play beta

## Endpoints

- `POST /api/player/session`
- `GET /api/player/session`
- `GET /api/play/operations`
- `POST /api/play/operations`
- `GET /api/play/operations/:operationId`
- `POST /api/play/operations/:operationId/join`
- `POST /api/play/operations/:operationId/start`
- `POST /api/play/operations/:operationId/actions`
- `GET /api/play/workshop`
- `POST /api/play/workshop`

- `GET /api/weekly-vault` returns the current deterministic weekly Vault Run challenge and beta scoreboard.
- `POST /api/weekly-vault/scores` accepts bounded, self-reported completed-run scores. The beta board is stored in the service data directory and survives restarts.

- `GET /health`
- `GET /api/competition/overview`
- `GET /api/competition/leaderboard?queue=all&limit=25`
- `GET /api/competition/agent-ladder?limit=25`
- `GET /api/competition/sessions?state=all&queue=all&limit=20`
- `GET /api/competition/badges`
- `GET /api/competition/profiles/:operatorId`

Legacy raw game, recommendation, and relay endpoints are available only with `AGENT_ENABLE_RAW_API=true`. They must remain disabled on the public service.

## Environment

- `AGENT_CONTRACT_ADDRESS`
- `AGENT_WORKSHOP_ADDRESS`
- `AGENT_RPC_URL`
- `AGENT_COMPETITION_SNAPSHOT_PATH` defaults to `agent-service/data/competition-index.json`
- `AGENT_COMPETITION_CACHE_MS` defaults to `60000`
- `AGENT_COMPETITION_STALE_MS` defaults to `900000`
- `AGENT_PORT` default `8787`
- `AGENT_HISTORY_LOOKBACK_BLOCKS` default `5000`
- `AGENT_ALLOW_ORIGIN` default `*`
- `AGENT_ENABLE_MANAGED_PLAY` default `false`
- `AGENT_ENABLE_RAW_API` default `false`
- `AGENT_SPONSOR_PRIVATE_KEY` required for managed play
- `AGENT_CUSTODY_SECRET` 32+ characters, required for managed play
- `AGENT_SESSION_SECRET` 32+ characters, required for managed play
- `AGENT_MANAGED_CHAIN_ID` default `11155111`
- `AGENT_MAX_GAS_PRICE_WEI` default `2000000000`
- `AGENT_MAX_TRANSACTION_WEI` default `500000000000000`
- `AGENT_DAILY_BUDGET_WEI` default `10000000000000000`
- `AGENT_SPONSOR_RESERVE_WEI` default `20000000000000000`
- `AGENT_MIN_PLAYER_FUNDING_WEI` default `100000000000000`
- `AGENT_MAX_PLAYER_BALANCE_WEI` default `1000000000000000`
- `AGENT_FUNDING_MULTIPLIER` default `3`
- `AGENT_SESSION_MAX_AGE_SECONDS` default `15552000`
- `AGENT_SPONSOR_BUDGET_PATH` default `agent-service/data/sponsor-budget.json`
- `AGENT_MANAGED_OPERATIONS_PATH` default `agent-service/data/managed-operations.json`
- `AGENT_MANAGED_SWEEP_INTERVAL_MS` default `15000`
- `AGENT_COMPETITION_CACHE_MS` default `15000`
- `AGENT_SEASON_LENGTH_DAYS` default `30`
- `AGENT_SEASON_EPOCH_SECONDS` default `1735689600`
- `AGENT_PLAYER_REGISTRY_PATH` default `agent-service/data/player-registry.json`
- `AGENT_ENABLE_SESSION_RELAY` default `false`
- `AGENT_SESSION_RELAY_PRIVATE_KEY` required only when the relay is enabled

## Player Registry

Use `agent-service/data/player-registry.json` to mark addresses as `human`, `agent`, or `bot`, plus optional display names, labels, and team info.

```json
{
  "profiles": [
    {
      "address": "0x0000000000000000000000000000000000000001",
      "displayName": "VaultBot Alpha",
      "type": "agent",
      "team": "Lucky Machines",
      "labels": ["bot", "autonomous"]
    }
  ]
}
```

## Run

```bash
npm run agent:start
```

In production, the root container starts this service on the internal
`AGENT_PORT` and proxies `/api/*` through `game.plundrix.com`. This keeps the
browser API same-origin and avoids a second public service. Set
`VITE_AGENT_SERVICE_URL=https://game.plundrix.com` in the Coolify build environment.

## Test

```bash
npm run test:agent
```

## Notes

- staging is Sepolia-first today
- the service should stay aligned with the free-play beta product posture
- all public browser writes go through the managed service
- keep sponsor, custody, and session secrets out of `VITE_*` variables and browser bundles
- keep `AGENT_ENABLE_RAW_API=false` on the public service
- use a dedicated low-balance sponsor wallet, not a deployer or treasury wallet
