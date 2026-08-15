# Sepolia Agent Tournament

This tournament compares five fixed Plundrix policies across 50 real FREE games on Sepolia. Every two-agent pairing plays five times. The scheduler gives every agent 20 appearances, including 10 in each wallet seat.

## Agents

- **The Operator** (`adaptive`) builds tools, converts good odds, and disrupts match-point rivals.
- **Lock Rusher** (`lock-rusher`) picks every round, accepting weak odds for race pressure.
- **Tool Hoarder** (`tool-hoarder`) builds two tools before converting them into picks.
- **Leader Hunter** (`leader-hunter`) sabotages material breakaways and advances when the race is compressed.
- **Saboteur** (`saboteur`) disrupts material threats, then builds and converts its own finishing position.

Agent identity is the policy assigned to a seat. The onchain players are the two disclosed HSM-backed test wallets, reused across FREE games:

- seat A / operator: `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`
- seat B / opponent: `0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f`

## Safety and execution

Run the read-only preflight:

```bash
npm run tournament:sepolia
```

The preflight checks the proxy, pause state, external-entropy configuration, operator roles, balances, live fees, existing checkpoint, and the complete remaining-game budget. It uses a 25% fee-price safety factor by default, conservative gas ceilings for both wallets, opponent funding, and a protected 0.02 Sepolia ETH operator reserve.

Only after the preflight reports a zero funding gap, explicitly authorize tournament writes:

```bash
PLUNDRIX_ALLOW_SEPOLIA_TOURNAMENT_WRITES=true npm run tournament:sepolia
```

The example is for Git Bash. In PowerShell, use:

```powershell
$env:PLUNDRIX_ALLOW_SEPOLIA_TOURNAMENT_WRITES='true'
npm run tournament:sepolia
```

The write runner:

- creates only FREE games;
- signs through the two configured Google Cloud KMS keys;
- supplies external drand entropy for every round;
- retries entropy through three public drand endpoints with bounded request timeouts;
- waits for a successful receipt after every transaction;
- checkpoints after every confirmed write;
- resumes an active game without duplicating submitted actions or entropy;
- stops if a game does not complete within 30 rounds;
- writes no private keys or access tokens to evidence.

Do not run two tournament processes at once. The checkpoint prevents ordinary restart duplication, but it is not a distributed lock.

## Evidence and report

Set `TOURNAMENT_RUN_ID` and `TOURNAMENT_STRATEGY_VERSION` to preserve named, comparable runs. During execution the runner atomically refreshes:

- `reports/sepolia-agent-tournament/<run-id>/state.json` - structured schedule, decisions, state transitions, receipts, gas, costs, and winners;
- `reports/sepolia-agent-tournament/<run-id>/report.md` - current standings, action mix, pacing, game ledger, method, and limitations.

The official before/after evidence is in `phase-1`, `phase-2`, and `comparison.md`. Pilot and diagnostic runs are excluded from the comparison.

The report is complete only when `status` is `complete` and the ledger contains 50 completed games. Results are live-network policy evidence, not human playtest evidence, and have no financial or prize implication.
