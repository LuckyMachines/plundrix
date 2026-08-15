# Plundrix Sepolia Agent Tournament

Generated: 2026-08-14T08:53:20.844Z

- Network: Sepolia (11155111)
- Contract: `0x1FF715D46470B4024D88A12838e08A60855f0AE2`
- Completed games: 2/50
- Total rounds: 31
- Average rounds per completed game: 15.50
- Confirmed gas used: 9603043

## Standings

| Rank | Agent | Games | Wins | Losses | Win rate | Avg rounds | Pick | Search | Sabotage |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Lock Rusher | 2 | 1 | 1 | 50.0% | 15.50 | 31 | 0 | 0 |
| 2 | The Operator | 2 | 1 | 1 | 50.0% | 15.50 | 15 | 6 | 10 |
| 3 | Leader Hunter | 0 | 0 | 0 | 0.0% | 0.00 | 0 | 0 | 0 |
| 4 | Saboteur | 0 | 0 | 0 | 0.0% | 0.00 | 0 | 0 | 0 |
| 5 | Tool Hoarder | 0 | 0 | 0 | 0.0% | 0.00 | 0 | 0 | 0 |

## Strategy roster

- **The Operator** (`adaptive`): Builds tools, converts strong odds, and disrupts a rival at match point.
- **Lock Rusher** (`lock-rusher`): Picks relentlessly and accepts weak odds for maximum race pressure.
- **Tool Hoarder** (`tool-hoarder`): Builds a three-tool stack before converting it into high-probability picks.
- **Leader Hunter** (`leader-hunter`): Targets breakaways, then searches or picks when the race is compressed.
- **Saboteur** (`saboteur`): Steals useful tools and applies stuns, but pivots to picks to close games.

## Games

| # | Onchain game | Seat A | Seat B | Winner | Rounds | Final transaction |
|---:|---:|---|---|---|---:|---|
| 1 | 2 | adaptive | lock-rusher | adaptive | 12 | 0xce86758c4f7077196634126e9609145ad7a12a7adcbd3ea893492cfa3e2db57b |
| 2 | 3 | adaptive | lock-rusher | lock-rusher | 19 | 0x9b3dd1d8e00a6482761db67fc6a1835bf8e9ab52c5c364c9d8661c93d133b177 |

## Method and limitations

- Every match is a FREE onchain game using the same two disclosed HSM-backed player wallets; agent identity is the strategy assigned to a seat, not a separate wallet identity.
- All actions, external entropy submissions, and resolutions are real Sepolia transactions with confirmed receipts.
- Pairings use every two-agent combination five times. Seat assignment is balanced by the deterministic scheduler.
- Results measure these fixed policies under live contract randomness. They are not human-playtest evidence and do not imply financial value.
