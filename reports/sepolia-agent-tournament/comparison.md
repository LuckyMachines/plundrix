# Plundrix Sepolia agent tournament: before and after

Two official, transaction-backed 50-game round robins were completed against the same Sepolia contract and balanced seat schedule. Phase 1 used `stabilized-v1`; phase 2 used `optimized-v2`. Pilot and diagnostic games are excluded.

## Executive result

The optimized policies produced materially faster and more balanced games without collapsing the five strategy identities.

| Metric | Phase 1 | Phase 2 | Change |
|---|---:|---:|---:|
| Completed games | 50 | 50 | 100 total |
| Total rounds | 654 | 515 | -21.3% |
| Mean rounds | 13.08 | 10.30 | -21.3% |
| Median rounds | 13 | 10 | -23.1% |
| 90th percentile | 18 | 13 | -27.8% |
| Maximum rounds | 23 | 18 | -21.7% |
| Win-rate spread | 65 points | 35 points | -30 points |
| Sabotage actions | 231 | 74 | -68.0% |
| Confirmed gas | 211,217,918 | 170,866,566 | -19.1% |
| Confirmed cost | 0.227373 ETH | 0.183267 ETH | -19.4% |
| Seat A wins | 25/50 | 19/50 | See limitations |

## Standings shift

| Agent | Phase 1 | Phase 2 | Win-rate change | Phase 2 action mix (P/S/Sab) |
|---|---:|---:|---:|---:|
| Saboteur | 17-3 (85%) | 14-6 (70%) | -15 points | 133 / 55 / 47 |
| The Operator | 9-11 (45%) | 10-10 (50%) | +5 points | 118 / 79 / 3 |
| Tool Hoarder | 6-14 (30%) | 10-10 (50%) | +20 points | 108 / 83 / 4 |
| Lock Rusher | 4-16 (20%) | 9-11 (45%) | +25 points | 204 / 0 / 0 |
| Leader Hunter | 14-6 (70%) | 7-13 (35%) | -35 points | 98 / 78 / 20 |

The middle of the field compressed around 45-50%. Saboteur remains the strongest policy, while Leader Hunter was over-corrected and is the clearest remaining balance target.

## Pairwise evidence

| Pairing | Phase 1 result / avg rounds | Phase 2 result / avg rounds |
|---|---|---|
| Operator vs Lock Rusher | Operator 4-1 / 12.2 | Operator 4-1 / 10.0 |
| Operator vs Tool Hoarder | Operator 5-0 / 8.2 | Tool Hoarder 3-2 / 9.6 |
| Operator vs Leader Hunter | Leader Hunter 5-0 / 10.8 | Operator 3-2 / 8.4 |
| Operator vs Saboteur | Saboteur 5-0 / 16.2 | Saboteur 4-1 / 12.0 |
| Lock Rusher vs Tool Hoarder | Tool Hoarder 4-1 / 8.8 | Tool Hoarder 4-1 / 9.2 |
| Lock Rusher vs Leader Hunter | Leader Hunter 4-1 / 10.8 | Lock Rusher 4-1 / 9.8 |
| Lock Rusher vs Saboteur | Saboteur 4-1 / 20.4 | Lock Rusher 3-2 / 11.8 |
| Tool Hoarder vs Leader Hunter | Leader Hunter 3-2 / 9.0 | Leader Hunter 3-2 / 9.0 |
| Tool Hoarder vs Saboteur | Saboteur 5-0 / 16.2 | Saboteur 4-1 / 11.2 |
| Leader Hunter vs Saboteur | Saboteur 3-2 / 18.2 | Saboteur 4-1 / 12.0 |

No optimized matchup averaged above 12 rounds. The worst baseline matchup, Lock Rusher vs Saboteur, improved by 8.6 rounds per game and reversed from 1-4 to 3-2.

## Changes tested

- Moved the universal anti-cycle pivot from round 12 to round 9.
- Let Tool Hoarder convert at two tools instead of three.
- Gated Leader Hunter sabotage on decisive, material threats.
- Required Saboteur to build and convert when no material threat exists.
- Added bounded entropy failover across three drand endpoints.

## Reliability and limitations

- All 100 official games, actions, entropy writes, resolutions, and winners have confirmed Sepolia receipts.
- Both batches resumed safely across bounded process windows without duplicate games or nonce collisions.
- Phase 1 encountered one drand DNS failure; the added failover completed phase 2 without another terminal entropy error.
- Phase 1 split wins evenly by seat; phase 2 favored seat B 31-19 despite every agent receiving 10 games in each seat. With only 50 games, this may be variance or a seat effect and deserves a larger follow-up sample.
- These are fixed-policy tests, not human playtests, economic-value claims, or proof of production-mainnet behavior.

## Final grade and next bar

- Balance: **B+** - substantially narrower field, but Saboteur at 70% and Leader Hunter at 35% leave work to do.
- Pacing: **A-** - the under-11 mean and 13-round p90 clear the stated target.
- Strategy diversity: **A** - five recognizable action profiles remain.
- Reliability: **A** - 100 official live-network games completed with auditable checkpoints and receipts.

The next stricter A experiment should modestly weaken Saboteur's material-threat trigger, restore some Leader Hunter conversion efficiency, and run enough games to distinguish seat variance from a genuine contract-order effect.
