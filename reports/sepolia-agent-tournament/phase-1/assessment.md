# Phase 1 assessment and phase 2 checklist

## Report card

| Category | Grade | Evidence | Stricter A bar |
|---|---|---|---|
| Balance | C | Win rates span 85% to 20%; Saboteur won 17/20. | No policy dominates every archetype; materially narrower spread. |
| Pacing | C+ | Mean 13.08 rounds; several matches reached 20-23 rounds. | Mean below 11 rounds and no systematic 16+ round matchup. |
| Strategy diversity | A- | Five distinct policies produced different action mixes and matchup results. | Preserve distinct identities after balance changes. |
| Reliability | A- | 50/50 games finalized through safe resumes; one drand DNS fault required a retry fix. | Automatic entropy failover and restart-safe completion without manual state edits. |

## Phase 2 implementation checklist

- [x] Move the universal anti-cycle pivot from round 12 to round 9.
- [x] Let Tool Hoarder convert at two tools instead of three.
- [x] Gate Leader Hunter sabotage on decisive, material threats.
- [x] Require Saboteur to build and convert when no material threat exists.
- [x] Add bounded drand failover across three public endpoints.
- [x] Run 50 fresh Sepolia games as `optimized-v2`.
- [x] Compare balance, pacing, actions, gas, seat effects, and reliability against phase 1.

## Phase 2 re-grade

| Category | Grade | Evidence |
|---|---|---|
| Balance | B+ | Win-rate spread fell from 65 to 35 percentage points; three agents finished at 45-50%, but Saboteur still led at 70%. |
| Pacing | A- | Mean fell to 10.30, median to 10, p90 to 13, and no matchup averaged above 12 rounds. |
| Strategy diversity | A | Distinct action profiles remained after sabotage fell from 231 to 74 total actions. |
| Reliability | A | Both official 50-game batches completed with restart-safe checkpoints and bounded three-endpoint entropy failover. |

Balance remains below the stricter A bar because Saboteur still leads the field and Leader Hunter fell to 35%. The next policy experiment should be a separately versioned run, not a silent change to this evidence set.
