# Managed Game Service

## Player promise

Plundrix behaves like a conventional hosted game. A player opens the site, receives an anonymous session, joins a table, and chooses actions. The player is never asked to connect a wallet, sign a transaction, hold a private key, select a network, acquire test currency, or understand the underlying settlement system.

Terms and Privacy retain accurate infrastructure disclosure. Normal gameplay, help, marketing, metadata, errors, and APIs expose only game concepts.

## Request path

1. `POST /api/player/session` creates an opaque signed session cookie.
2. The service deterministically derives a server-custodied player account from the session ID and `AGENT_CUSTODY_SECRET`.
3. The browser sends a game command such as create, join, start, act, craft, equip, or reclaim.
4. The service validates origin, session, command shape, table rules, rate limits, chain ID, fee ceiling, transaction ceiling, daily budget, and sponsor reserve.
5. When needed, the sponsor transfers only a bounded amount to that derived player account.
6. The derived account submits the command. Writes are serialized to prevent nonce races.
7. The service waits for confirmation and returns sanitized game state. It never returns addresses, hashes, block numbers, RPC details, balances, or network names.

## Secrets and wallet isolation

- `AGENT_SPONSOR_PRIVATE_KEY` belongs to a dedicated, low-balance Sepolia sponsor. Never use the deployer, owner, upgrader, treasury, or a personal wallet.
- `AGENT_CUSTODY_SECRET` derives player accounts. Rotating it changes every derived account, so preserve it in the deployment secret store and back it up securely.
- `AGENT_SESSION_SECRET` signs browser sessions. It can be rotated to invalidate all active sessions.
- None of these values may use a `VITE_` prefix or enter a frontend build argument.
- Public production must keep `AGENT_ENABLE_RAW_API=false` and `AGENT_ENABLE_SESSION_RELAY=false`.

## ETH conservation controls

The default ceilings are intentionally conservative:

| Control | Default | Purpose |
| --- | ---: | --- |
| Maximum gas price | 2 gwei | Wait out fee spikes instead of overspending |
| Maximum command cost | 0.0005 ETH | Reject unexpectedly expensive calls |
| Daily sponsored outflow | 0.01 ETH | Hard daily blast-radius ceiling, including conservative funding gas |
| Sponsor reserve | 0.02 ETH | Stop before the service wallet is drained |
| Minimum player top-up | 0.0001 ETH | Avoid a transfer before every small command |
| Maximum derived-account balance | 0.001 ETH | Limit stranded value per anonymous session |
| Funding multiplier | 3x | Amortize top-up gas without materially overfunding |

The daily ledger is written atomically to `agent-service/data/sponsor-budget.json` and resets by UTC date. Managed operation IDs are stored in `agent-service/data/managed-operations.json` so the service can finish fully submitted and timed-out rounds. Verified weekly scores are stored atomically in `agent-service/data/weekly-vault-scores.json`; eight challenge weeks and 250 submissions per week are retained. The public competition index keeps a last-known-good snapshot in `agent-service/data/competition-index.json`, so public pages can start quickly while fresh chain data is rebuilt in the background. Persist all four paths across container replacements. If storage is ephemeral, point `AGENT_SPONSOR_BUDGET_PATH`, `AGENT_MANAGED_OPERATIONS_PATH`, `AGENT_WEEKLY_VAULT_SCORES_PATH`, and `AGENT_COMPETITION_SNAPSHOT_PATH` at a mounted volume.

Tune limits from measured receipts, not guesses. Lower the daily budget after observing normal traffic; raise the per-command ceiling only when a known contract call demonstrably needs it. A rejected command must fail before any player-funded write.

## Production configuration

Set runtime variables from `.env.example`. At minimum:

```text
AGENT_ENABLE_MANAGED_PLAY=true
AGENT_ENABLE_RAW_API=false
AGENT_ALLOW_ORIGIN=https://game.plundrix.com
AGENT_RPC_URL=<private-or-rate-limited-sepolia-rpc>
AGENT_MANAGED_CHAIN_ID=11155111
AGENT_CONTRACT_ADDRESS=<game-proxy>
AGENT_WORKSHOP_ADDRESS=<workshop-proxy>
AGENT_SPONSOR_PRIVATE_KEY=<dedicated-low-balance-key>
AGENT_CUSTODY_SECRET=<32+-character-random-secret>
AGENT_SESSION_SECRET=<different-32+-character-random-secret>
AGENT_WEEKLY_VAULT_SCORES_PATH=/data/plundrix/weekly-vault-scores.json
AGENT_COMPETITION_SNAPSHOT_PATH=/data/plundrix/competition-index.json
PLUNDRIX_HEALTH_MAX_LATENCY_MS=5000
```

Use same-origin `/api` proxying in production. Set `VITE_AGENT_SERVICE_URL` to blank for same-origin or to the exact public origin. Do not configure browser RPC, contract, workshop, WalletConnect, relay, or session-key variables in the production frontend build.

## Operational checks

- Confirm `/health` reports `play.enabled: true` without exposing infrastructure details.
- Confirm the dedicated sponsor has only the minimum resolver and randomizer permissions needed to finish hosted rounds.
- Create two fresh browser sessions, join one operation, start it, and submit a full round.
- Confirm responses and rendered pages contain no `0x` addresses, transaction hashes, RPC URLs, network names, fee language, or signing prompts.
- Confirm the session cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production, and scoped to `/`.
- Confirm a wrong `Origin`, expired or tampered session, excessive request rate, fee spike, oversized command, exhausted daily budget, wrong chain ID, or low sponsor reserve fails closed.
- Monitor service error classes and remaining sponsor balance without sending secrets, derived addresses, or session tokens to analytics.
- Run `npm run ops:health` after deployment and on the scheduled GitHub workflow. It checks the site, durable weekly board, public leaderboard, sitemap, social card, and byte-range music delivery without using player credentials. Every probe must also finish inside `PLUNDRIX_HEALTH_MAX_LATENCY_MS`.
- Keep GitHub Actions failure notifications enabled for the repository. The scheduled workflow retains its machine-readable health report for 14 days.
- Run `npm run ops:backup-competition` from the service host or against a mounted copy of the score store. Preserve the JSON export and adjacent SHA-256 record outside the container.

## Recovery

- Low sponsor balance: replenish only the dedicated sponsor or reduce limits; never disable the reserve check.
- RPC failure or fee spike: let live tables show the generic temporary-unavailable state; practice play remains available.
- Suspected session-secret exposure: rotate `AGENT_SESSION_SECRET` and restart; all sessions reissue automatically.
- Suspected custody-secret exposure: disable managed play, rotate the secret, sweep only through a reviewed recovery script, and treat prior derived accounts as compromised.
- Sponsor-key exposure: disable managed play, replace the dedicated sponsor key, and leave deployer and owner credentials untouched.
