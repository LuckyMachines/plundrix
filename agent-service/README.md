# Plundrix Agent Service

This service gives agents and supporting app surfaces a normalized HTTP layer over the on-chain Plundrix contract.

It is intentionally read-first:

- normalized game snapshot endpoint
- available-actions endpoint for a specific player
- recent history endpoint
- heuristic recommendation endpoint
- season overview and leaderboard endpoints
- profile, badges, and recent-session endpoints
- explicit queue segmentation for open tables, mixed tables, and agent ladders

It does not sign transactions or custody wallets.

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

- `GET /health`
- `GET /api/games?limit=20&offset=0`
- `GET /api/competition/overview`
- `GET /api/competition/leaderboard?queue=all&limit=25`
- `GET /api/competition/agent-ladder?limit=25`
- `GET /api/competition/sessions?state=all&queue=all&limit=20`
- `GET /api/competition/badges`
- `GET /api/competition/profiles/:playerAddress`
- `GET /api/games/:gameId`
- `GET /api/games/:gameId/available-actions/:playerAddress`
- `GET /api/games/:gameId/history?fromBlock=...&toBlock=...`
- `POST /api/recommend-action`

Example request body:

```json
{
  "gameId": 1,
  "playerAddress": "0x0000000000000000000000000000000000000001"
}
```

## Environment

- `AGENT_CONTRACT_ADDRESS` or `VITE_CONTRACT_ADDRESS`
- `AGENT_RPC_URL` or one of `VITE_FOUNDRY_RPC_URL`, `VITE_RPC_URL`, `SEPOLIA_RPC_URL`, `ANVIL_RPC_URL`
- `AGENT_PORT` default `8787`
- `AGENT_HISTORY_LOOKBACK_BLOCKS` default `5000`
- `AGENT_ALLOW_ORIGIN` default `*`
- `AGENT_COMPETITION_CACHE_MS` default `15000`
- `AGENT_SEASON_LENGTH_DAYS` default `30`
- `AGENT_SEASON_EPOCH_SECONDS` default `1735689600`
- `AGENT_PLAYER_REGISTRY_PATH` default `agent-service/data/player-registry.json`

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

## Test

```bash
npm run test:agent
```

## Notes

- staging is Sepolia-first today
- the service should stay aligned with the free-play beta product posture
- recommendation output is advisory only; transaction execution remains wallet-side
