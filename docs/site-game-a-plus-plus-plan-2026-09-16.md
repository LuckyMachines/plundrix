# Plundrix Site and Game A++++ Improvement Pass

Date: 2026-09-16
Operating mode: one maintainer, one active experiment, evidence before expansion

## Outcome

Make Plundrix faster to trust, easier to read, more expressive to play, and more likely to earn a second match without adding another mode, another bulk asset family, or another operating burden.

## Baseline report card

| Area | Grade | Evidence and A++++ gap |
|---|---:|---|
| Automated reliability | A | Eighteen improvement gates and 42 canonical UI renders pass. Production behavior still needs latency and deployment checks. |
| First-session UX | B+ | Instant Play is obvious and wallet-free, but no current newcomer cohort has validated first-action or result comprehension. |
| Core decision loop | B+ | Pick, Search, and Sabotage are readable and balanced in simulation. Repetition, perceived agency, and rival-reading remain unmeasured with people. |
| Visual direction | A- | The caper language is coherent, but the active HUD is dense and secondary surfaces still lean on flat panels and microcopy. |
| Rival personality | B | Rook, Mara, and Vesper have strategies, grudges, and reactions, but much of that character is conveyed as labels rather than readable table behavior. |
| Workshop and progression | B+ | Ten signature powers and 1,200 deterministic builds exist. The first craft and equipped effect need stronger physical feedback and recommendation. |
| Audio | B+ | Recorded CC0 cues and music replaced procedural noise. Real-device mix validation, correct streaming headers, and fatigue evidence remain open. |
| Retention | B | Exact replays, local career, weekly challenges, and rematches exist. The strongest continuation and seven-day return behavior are not yet known. |
| Live service | B | The public service is healthy, but a cold leaderboard read took about 11 seconds and its cache rebuild scans every game. |
| Marketing and SEO | A- | The sparse homepage and technical discovery system are strong. Search performance and conversion evidence are absent. |
| Real player and growth evidence | F | One of nine product metrics is qualified. No current newcomer, return, or production-funnel sample exists. |

## Sequenced implementation checklist

### P0 - Honest evidence and production reliability

- [x] Preserve one active newcomer-comprehension experiment and generate a concise facilitator handoff.
- [x] Add a production-funnel readiness check without fabricating traffic or player results.
- [x] Coalesce concurrent competition refreshes and serve a bounded stale snapshot while refreshing.
- [x] Persist the last valid competition index for fast service restarts and expose freshness metadata.
- [x] Reduce passive competition polling and verify a bounded response-time contract.
- [x] Serve MP3 files as `audio/mpeg` with byte-range support and test delivery behavior.

### P1 - One dominant gameplay decision

- [x] Collapse secondary active-match utilities behind one compact command menu.
- [x] Make mobile action changing open an in-place action chooser rather than requiring page travel.
- [x] Preserve one dominant vault, one rival read, three actions, and one commit control in the active viewport.
- [x] Add deterministic browser coverage for the compact command menu and mobile action chooser.

### P2 - Read the rivals, not the dashboard

- [x] Translate rival strategy and recent behavior into concise, non-certain tells.
- [x] Give each rival a distinct visual motif and reaction without making color the only signal.
- [x] Explain likely opportunity and counterplay at decision time without revealing hidden actions.
- [x] Track repeated-action and action-switch signals through the bounded anonymous event vocabulary.

### P3 - Make progression tactile

- [x] Add a large selected-gadget workbench preview with signature effect, cost, and in-play purpose.
- [x] Recommend one achievable first build from current materials without hiding player choice.
- [x] Add accessible assembly feedback and a clear before/after equipped state.
- [x] Keep the 1,200 combinations as depth, not as 1,200 equal visual choices.

### P4 - Make the ending choose the next session

- [x] Present one progress-aware recommended continuation beside immediate rematch.
- [x] Move replay, sharing, and destination links into a compact secondary action group.
- [x] Track the chosen continuation so real evidence can determine the long-term winner.

### P5 - Sharpen the sparse marketing promise

- [x] Preserve the one-screen homepage and dominant instant-play CTA.
- [x] Improve gameplay proof legibility without adding sections or unsupported social proof.
- [x] Verify reduced motion, small-screen fit, metadata, and production build.

### P6 - Solo-maintainer resilience

- [x] Extract only the gameplay HUD and media-serving seams touched by this pass.
- [x] Update stale durability and audio documentation.
- [x] Run focused unit, service, browser, accessibility, visual, build, and improvement gates.
- [x] Re-grade the result and leave human/traffic evidence open until it exists.

## Explicit non-goals

- No new game mode.
- No additional bulk asset generation.
- No guild, chat, or account platform before return behavior supports it.
- No mainnet deployment or paid-mode marketing.
- No invented testimonials, conversion claims, player observations, or retention data.

## Stricter A++++ bar

- Four newcomers act within 60 seconds without coaching; at least 80 percent explain the goal and round result.
- Production Instant Play reaches at least 30 starts with 65 percent completion and a client-error rate below 2 percent over at least 100 page views.
- The active screen preserves its decision hierarchy at desktop, laptop, and mobile sizes without hiding required choices.
- Cold competition reads return a useful cached response quickly and refresh without duplicate full-chain scans.
- Pick, Search, Sabotage, failure, breach, and reward are distinguishable on ordinary laptop speakers without audio carrying required information.
- One post-match continuation wins a declared experiment and two players return after seven days.

## Re-grade after implementation

| Area | Grade | Evidence after this pass |
|---|---:|---|
| Automated reliability | A+ | The full deterministic suite, production build, delivery tests, and 48-state visual matrix pass. |
| First-session UX | A- | The action hierarchy is simpler and the facilitator handoff is ready; four observed newcomers remain required. |
| Core decision loop | A- | Instant Play and Vault Run now share the same mobile choice loop and action-switch telemetry; human agency evidence remains open. |
| Visual direction | A | The vault stays dominant, utilities recede, and approved desktop/laptop/mobile references cover the changed surfaces. |
| Rival personality | A- | Named strategies now become state-based tells in the table and operation file without exposing concealed moves. |
| Workshop and progression | A | The existing physical preview now gains an achievable recommendation and an accessible assembly payoff. |
| Audio | A- | Correct MIME/range delivery is enforced; ordinary-speaker fatigue still requires a human listening pass. |
| Retention | B+ | Rematch and one progress-aware objective are persistently reachable; seven-day return evidence remains missing. |
| Live service | A- | Refreshes are coalesced, cached to disk, served stale while refreshing, and governed by a latency budget; production rollout remains to be measured. |
| Marketing and SEO | A | The one-screen promise has clearer real-game proof and all 237 discovery checks pass; traffic conversion remains ungraded. |
| Real player and growth evidence | F | No human or production behavior was invented. The current ledger still has 1 of 9 qualified metrics. |

## Verification record

- Game production build: pass, 1,153 modules transformed.
- Full core suite: 25 service tests, 54 Solidity tests, 98 JavaScript tests, and 5 tournament tests passed.
- Improvement harness: all 18 automated gates passed.
- Improvement process: A+ after recording the completed weekly-board durability experiment with T2 proof and scheduling the next newcomer review.
- Focused browser coverage: Workshop, Instant Play mobile, and shared Vault Run mobile command passed with serious/critical accessibility checks.
- Canonical browser matrix: 48 of 48 states passed, including readable sealed/reveal/impact/recovery semantics in reduced-motion mode.
- Marketing production build and discovery export: pass; 237 of 237 production discovery checks pass.
- Canonical visual baselines were reviewed and approved only for the intentionally changed gameplay, final-briefing, Workshop, live-table, and Sound Locker surfaces.

## Still requires people or production traffic

- Four uncoached newcomer observations using `docs/playtests/a-plus-plus-facilitator-handoff.md`.
- Two seven-day return observations.
- Search Console and Plausible aggregates at the sample sizes in the improvement ledger.
- Post-deploy production latency and audio-range confirmation through `npm run ops:health`.
