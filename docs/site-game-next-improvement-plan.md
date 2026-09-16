# Site and Game Improvement Plan

Date: 2026-09-15
Operating mode: one maintainer, one active experiment, evidence before expansion

## Outcome

Make the first Plundrix operation easier to choose, more memorable to finish, and more likely to create a return visit without adding another game mode or a new content treadmill.

## Baseline

| Area | Grade | Evidence gap |
|---|---:|---|
| Reliability and responsive UI | A+ | Automated release and visual gates pass. |
| Core game systems | A | Simulation is strong; observed human fun remains ungraded. |
| First-time experience | B+ | The journey is coached, but no current newcomer sample exists. |
| Visual world | B+ | The active table is distinctive; secondary surfaces rely more heavily on flat panels. |
| Retention | B | Exact replays, local progression, and restart-durable weekly submissions exist; seven-day return evidence is still missing. |
| Growth evidence | F | Only one of nine behavioral metrics has qualified evidence. |

## Sequenced implementation checklist

### P0 - Learn before expanding

- [x] Keep one active first-operation comprehension experiment.
- [x] Preserve an anonymous, timed four-session observation workflow at `/playtest`.
- [ ] Observe four first-time players without coaching and import the results. External: requires recruited players.
- [ ] Observe two returning players after seven days. External: requires elapsed time and recruited players.
- [ ] Import qualified Search Console and Plausible aggregates. External: requires read-only credentials and minimum samples.

### P1 - One obvious first path

- [x] Make Instant Play the dominant Player Hub recommendation.
- [x] Collapse Vault Run and Live Table into clearly secondary paths without hiding them.
- [x] Remove the repeated live-mode pitch while preserving live-table status and creation controls.
- [x] Give an active or resumable operation precedence over starting another table.

### P2 - Durable return value

- [x] Persist verified weekly challenge submissions with bounded, atomic server storage.
- [x] Recover safely from missing, malformed, or incompatible storage.
- [x] Expose honest durability state without leaking filesystem details.
- [x] Add automated restart, duplicate-submission, pruning, and corruption tests.

### P3 - Memorable consequences

- [x] Derive one truthful defining moment from each completed operation.
- [x] Reuse the same moment in the final briefing, saved replay, and replay share card.
- [x] Point the continuation action at the player's strongest unfinished objective.

### P4 - One physical caper world

- [x] Introduce a reusable artifact-stage component for secondary surfaces.
- [x] Turn the Hub choice into a heist briefing rather than three equal marketing cards.
- [x] Strengthen Career as an operator dossier, Workshop as a gadget bench, Vault Run as a route board, and Live Table as a crew table.
- [x] Preserve reduced motion, readable text, keyboard access, and mobile fit.

### P5 - Low-concurrency live play

- [x] Explain when a player can begin and how their seat survives a return.
- [x] Offer an immediate agent-table escape hatch when a human table cannot begin.
- [x] Show compact table occupancy and readiness instead of an apparently empty waiting room.

### P6 - Audio distinction

- [x] Verify that Pick, Search, Sabotage, failure, breach, and reward use distinct cue families.
- [x] Add deterministic cue-contract tests and a concise speaker/headphone review script.
- [x] Keep every required state readable with audio disabled.

### P7 - Sparse marketing proof

- [x] Preserve the one-viewport homepage.
- [x] Make the CTA promise immediate play explicitly.
- [x] Offer one quiet trailer link without restoring a long marketing page.
- [x] Keep the current real gameplay image optimized and responsive.

### P8 - Solo operator safeguards

- [x] Add a production health command covering frontend, API, assets, storage readiness, and bounded latency.
- [x] Add a backup/export command for durable competition data.
- [x] Produce one short machine-readable weekly health summary and fail on actionable regressions.
- [x] Document the production volume and alert configuration required from the host.

## Re-grade after implementation

| Area | Grade | Current evidence |
|---|---:|---|
| Reliability and responsive UI | A+ | Build, deterministic suites, operator safeguards, and canonical desktop/mobile review are automated. |
| Core game systems | A | Defining moments and causal outcomes are integrated; observed human fun is still ungraded. |
| First-time experience | A- | Instant Play is unmistakably primary and resumes are protected; the four-person observation is still required. |
| Visual world | A- | Hub, Career, Vault Run, Workshop, and live operations now share the physical caper language. |
| Retention | B+ | Weekly proof survives service restarts, tables can be reopened, and post-match objectives respond to local progress; seven-day return evidence is still required. |
| Growth evidence | F | The homepage is sharper, but production Search Console and Plausible samples are still missing. |
| Solo operations | A- | One-command health and checksum-backed backups exist; the production host volume and alert must still be configured and exercised. |

## Verification record

- All 18 automated improvement checks passed, including the game production build and static SEO checks.
- The full core suite passed: 22 agent/service tests, 54 Solidity tests, 98 JavaScript contract tests, and five tournament tests.
- The 48-state canonical visual comparison passed after individual review and approval of the eight intentional baseline changes: Player Hub, final briefing, Vault Run route choice, and Career at desktop/mobile sizes.
- The affected browser journeys and the complete two-player create, join, start, and commit flow passed after integration.
- Marketing discovery tests and the production Next.js build passed.
- Human observation, production analytics import, production volume activation, and alert delivery remain external operational tasks and are not represented as completed product evidence.

## Explicit non-goals

- No new game mode.
- No bulk asset generation.
- No speculative social or guild system.
- No mainnet deployment until retention, operations, legal, and rollback evidence exist.
- No claims of comprehension, delight, conversion, or retention without qualified observations.

## Stricter A bar

- At least 90 percent of four newcomers make a first action without facilitation in under 60 seconds.
- At least 80 percent can explain the goal and the cause of a round result.
- One path is unmistakably recommended while every alternative remains reachable.
- Weekly proof survives a service restart and malformed storage cannot prevent startup.
- Every completed operation names a real defining moment and one relevant next objective.
- Secondary surfaces share the same physical caper language as the main table.
- A player can always start immediately even when no other human is present.
- Production health and backup checks can be run by one person in under five minutes.
