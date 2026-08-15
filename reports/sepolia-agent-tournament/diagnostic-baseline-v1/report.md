# Plundrix Sepolia Agent Tournament

Generated: 2026-08-14T11:26:20.125Z

- Run: `phase-1`
- Strategy version: `baseline-v1`
- Network: Sepolia (11155111)
- Contract: `0x1FF715D46470B4024D88A12838e08A60855f0AE2`
- Completed games: 13/50
- Total rounds: 141
- Average rounds per completed game: 10.85
- Confirmed gas used: 46702933

## Standings

| Rank | Agent | Games | Wins | Losses | Win rate | Avg rounds | Pick | Search | Sabotage |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Leader Hunter | 3 | 2 | 1 | 66.7% | 17.33 | 23 | 6 | 23 |
| 2 | Tool Hoarder | 5 | 3 | 2 | 60.0% | 9.80 | 21 | 28 | 0 |
| 3 | The Operator | 13 | 6 | 7 | 46.2% | 10.85 | 71 | 48 | 22 |
| 4 | Lock Rusher | 5 | 2 | 3 | 40.0% | 8.00 | 40 | 0 | 0 |
| 5 | Saboteur | 0 | 0 | 0 | 0.0% | 0.00 | 0 | 0 | 0 |

## Strategy roster

- **The Operator** (`adaptive`): Builds tools, converts strong odds, and disrupts a rival at match point.
- **Lock Rusher** (`lock-rusher`): Picks relentlessly and accepts weak odds for maximum race pressure.
- **Tool Hoarder** (`tool-hoarder`): Builds a three-tool stack before converting it into high-probability picks.
- **Leader Hunter** (`leader-hunter`): Targets breakaways, then searches or picks when the race is compressed.
- **Saboteur** (`saboteur`): Steals useful tools and applies stuns, but pivots to picks to close games.

## Games

| # | Onchain game | Seat A | Seat B | Winner | Rounds | Final transaction |
|---:|---:|---|---|---|---:|---|
| 1 | 4 | adaptive | lock-rusher | adaptive | 8 | 0x4fccfa492bd06a2b932f9f7b3143fb70c93ef15e8e6dde5cb7699065f7c0632a |
| 2 | 5 | adaptive | lock-rusher | adaptive | 11 | 0x7b05dabb2ff7a4adc203dd248e37b8c293f8393b72937402a5496b3161727d44 |
| 3 | 6 | adaptive | lock-rusher | lock-rusher | 5 | 0xfb6059343b2addd00edfc6c63734f0f033a662cffe9b06df4e363b516499dd58 |
| 4 | 7 | lock-rusher | adaptive | adaptive | 9 | 0x89accf1ca14c375c48c67f24e374220b60c2532a68a3c6ee87b116033d9d2fb0 |
| 5 | 8 | lock-rusher | adaptive | lock-rusher | 7 | 0x1be9414c5235f6559cec26af77d2eba3e2b73dd5627b4f0012587d05f6ec677b |
| 6 | 9 | adaptive | tool-hoarder | adaptive | 7 | 0xdc4d661ea2eea58eae372db6626c60731a9c4a6008ceea83c694e9730c6a1134 |
| 7 | 10 | adaptive | tool-hoarder | tool-hoarder | 12 | 0x65b6b1bcb0b36f64e8ed4182a7f61da44696c61b4dee3bf48982e2da1e74aea3 |
| 8 | 11 | adaptive | tool-hoarder | tool-hoarder | 10 | 0xfb5e5d0258927bfcfad6ba630cb4e0fe2ef01dd881ae0d58cf47d162fcc82b8c |
| 9 | 12 | tool-hoarder | adaptive | adaptive | 8 | 0x7e18280aa8a52821b7500d7920b012c77293adce113e780832c5ba61ab326a1f |
| 10 | 13 | tool-hoarder | adaptive | tool-hoarder | 12 | 0x63e7298b30ae052014b3c426e4bcf920ffbfad3d01904a455fc6161a540d7d75 |
| 11 | 14 | leader-hunter | adaptive | leader-hunter | 16 | 0x71cbc43b198c209ad10852d8eef699062ea0ac9eeed3a19fb2d7dcf34ddba035 |
| 12 | 15 | leader-hunter | adaptive | adaptive | 10 | 0x7cfa96e7fa8b46ec901b2db423ac0db0a0e8780a40125a6bbe6e04f2ed78444e |
| 13 | 16 | leader-hunter | adaptive | leader-hunter | 26 | 0x93d891eaa2e80357a9ff767d6ddfa5bf596458bb22c98966d503eb540e18bb01 |

## Method and limitations

- Every match is a FREE onchain game using the same two disclosed HSM-backed player wallets; agent identity is the strategy assigned to a seat, not a separate wallet identity.
- All actions, external entropy submissions, and resolutions are real Sepolia transactions with confirmed receipts.
- Pairings use every two-agent combination five times. Seat assignment is balanced by the deterministic scheduler.
- Results measure these fixed policies under live contract randomness. They are not human-playtest evidence and do not imply financial value.
