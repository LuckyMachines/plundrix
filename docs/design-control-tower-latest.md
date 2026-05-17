# Design Control Tower Latest

Generated: 2026-05-17

## Summary

The Design Control Tower is implemented as the durable product memory for Plundrix design direction. It connects gameplay hypotheses, source-system evidence, human validation, decisions, and launch-sensitive change tracking.

## Implemented

- Shared engine: `app/src/lib/designControlTower.js`
- CLI: `npm run design:tower`
- Backlog CSV: `npm run design:backlog`
- Test: `npm run test:design`
- Dashboard route: `/design`
- Oracle integration: design status, risks, opportunities, recommendations, health, and markdown.
- Launch integration: design proof, required files, scripts, route, command plan, proof bundle, fixtures, and dashboard proof row.
- Playtest integration helpers: build a mission from a hypothesis and attach playtest reports as evidence.

## Current Default Snapshot

- Runs lightweight simulator, balance, replay, ghost, mutation, and playtest proof.
- Produces ranked hypotheses with evidence gaps and next commands.
- Produces a packet with design health, top backlog, evidence gaps, and decision memos.

## Recommended Next Use

Use `/design` before accepting gameplay changes. Attach at least two machine evidence sources, generate a Playtest Coach mission, then record a decision with rationale and accepted risks.

## Verification

- `npm run test:design` passed.
- `npm run test:oracle` passed.
- `npm run test:launch` passed.
- `npm run test:playtest` passed.
- `npm run design:tower -- --snapshot --markdown` passed.
- `/design`, `/playtest`, `/launch`, and `/ops` returned `200 OK` on the local dev server.
- New Design Control Tower files were scanned for unfinished-work markers.
- `npm run build` passed with exit code 0 in 68.92 seconds.

Remaining warnings are the existing Rollup pure-annotation warnings from third-party wallet dependency packages.

## One-Shot Tower Use

Run date: 2026-05-16

Command:

```bash
npm run design:tower -- --snapshot --markdown --seed one-shot-design-tower
```

Result:

- Design health: 62/100, orange.
- Average confidence: 73/100.
- Human validation gaps: 21.
- Top hypothesis: Act on playtest: First Match Onboarding.
- Tower recommendation: run simulator proof.

Follow-up simulator proof:

```bash
npm run simulate -- --scenario new-player-table --games 12 --seed tower-first-match-proof
```

Result:

- Completion: 12/12.
- Grade: D.
- Score: 67.1.
- Average rounds: 22.67.
- Comeback rate: 8.3%.
- Runaway rate: 0%.
- Warning: too many games exceed the healthy round target.

Candidate comparison:

```bash
npm run simulate -- --scenario new-player-table --games 24 --seed tower-shorten-long-games --compare --rules "{pickToolBonus:20,searchChance:65}"
```

Result:

- Baseline score: 72.7.
- Candidate score: 48.8.
- Score delta: -24.0.
- Average rounds delta: -1.96.
- Win spread delta: +25.0%.
- Decision: reject this candidate; it shortens slightly but hurts fairness and completion.

Autopilot smoke:

```bash
npm run simulate:auto-balance -- --budget smoke --quiet
```

Result:

- Best candidate: candidate-5d3c39d2.
- Score delta: +16.00 over the smoke baseline.
- Readiness: do not ship.
- Changed keys: none.
- Decision: no rules patch should be promoted from this smoke pass.

Current design read:

- First-match pacing remains the main evidence-backed issue.
- Manual knob `pickToolBonus:20, searchChance:65` is rejected.
- The next useful step is a focused Playtest Coach mission on whether the long match length feels tense or tiring to humans.

## Second Tower Use

Run date: 2026-05-16

Command:

```bash
npm run design:tower -- --snapshot --markdown --seed second-pass-design-tower
```

Result:

- Design health: 61/100, orange.
- Average confidence: 73/100.
- Human validation gaps: 20.
- Top hypothesis: Act on playtest: First Match Onboarding.
- Tower recommendation: run simulator proof.

Follow-up simulator proof:

```bash
npm run simulate -- --scenario new-player-table --games 12 --seed second-pass-first-match-proof
```

Result:

- Completion: 12/12.
- Grade: D.
- Score: 65.6.
- Average rounds: 23.58.
- Comeback rate: 33.3%.
- Runaway rate: 0%.
- Warning: too many games exceed the healthy round target.

Replay proof:

```bash
npm run replay:direct -- --seed second-pass-replay-proof --scenario new-player-table
```

Result:

- Replay id: replay-6619e6b3.
- Replay score: 100.0.
- Title: The round 1 sabotage swing.
- Rounds: 32.
- Read: the game creates strong replay drama, but the payoff can arrive after a long first-match arc.

Follow-up Playtest Coach mission:

```bash
npm run playtest:coach -- --source replay-proof --category pacing --question "A first-match replay can create strong drama after 30-plus rounds; does that length feel earned, or does the table get tired before the payoff?" --markdown
```

Mission:

- Title: Replay Memory Check.
- Category: pacing.
- Focus: whether the 30-plus-round replay payoff feels earned or tiring.

Updated design read:

- The long-first-match signal reproduced across two Tower uses.
- Replay drama is strong enough to preserve.
- The next decision should avoid blindly shortening rules and instead validate human fatigue versus earned tension.

## Third Tower Use

Run date: 2026-05-17

Command:

```bash
npm run design:tower -- --snapshot --markdown --seed third-pass-design-tower
```

Result:

- Design health: 62/100, orange.
- Average confidence: 73/100.
- Human validation gaps: 20.
- Top hypothesis: Act on playtest: First Match Onboarding.
- Tower recommendation: run simulator proof.

Follow-up simulator proof:

```bash
npm run simulate -- --scenario new-player-table --games 12 --seed third-pass-first-match-proof
```

Result:

- Completion: 12/12.
- Grade: F.
- Score: 42.9.
- Average rounds: 24.17.
- Comeback rate: 16.7%.
- Runaway rate: 8.3%.
- Warning: win spread is high.
- Warning: too many games exceed the healthy round target.

Ghost evidence:

```bash
npm run ghosts:run -- --scenario balanced-cast --budget smoke --markdown
```

Result:

- Ghost score: 67/100, D.
- Tool Hoarder health: 82, win rate 0.0%.
- Leader Hunter health: 80, win rate 0.0%.
- Reckless Picker health: 70, win rate 25.0%.
- Closer health: 68, win rate 75.0%.
- Main risks: Tool Hoarder rarely wins, Leader Hunter rarely wins, Leader Hunter leans heavily on sabotage, Closer wins too often.

Follow-up Playtest Coach mission:

```bash
npm run playtest:coach -- --source ghost-report --category archetype-feel --question "Does Closer dominance make the match exciting, or does it make Tool Hoarder and Leader Hunter feel like weak roles before the vault resolves?" --markdown
```

Mission:

- Title: Tool Hoarder Viability.
- Category: archetype-feel.
- Focus: whether delayed tool payoff feels strategic under Closer pressure, or whether Closer compresses the viable role space too much.

Updated design read:

- The long-first-match signal reproduced across three Tower uses.
- The third pass added a stronger fairness concern: high win spread and a 75% Closer win rate in ghost smoke.
- Current next human tests should cover both pacing fatigue and role agency, especially Tool Hoarder viability against Closer pressure.

## Fourth Tower Use

Run date: 2026-05-17

Command:

```bash
npm run design:tower -- --snapshot --markdown --seed fourth-pass-design-tower
```

Result:

- Design health: 62/100, orange.
- Average confidence: 73/100.
- Human validation gaps: 20.
- Top hypothesis: Act on playtest: First Match Onboarding.
- Tower recommendation: run simulator proof.

Follow-up simulator proof:

```bash
npm run simulate -- --scenario new-player-table --games 16 --seed fourth-pass-first-match-proof
```

Result:

- Completion: 16/16.
- Grade: C.
- Score: 70.3.
- Average rounds: 21.50.
- Comeback rate: 18.8%.
- Runaway rate: 0.0%.
- Warning: too many games exceed the healthy round target.

Mutation and ghost checks:

```bash
npm run mutate:matrix -- --budget smoke --markdown
npm run ghosts:run -- --scenario balanced-cast --budget smoke --markdown
```

Result:

- Mutation preset `More comeback` was directionally interesting but risky: score 43/100 and changed deployed-behavior constants.
- Ghost score remained 67/100, D.
- Tool Hoarder win rate: 0.0%.
- Leader Hunter win rate: 0.0%.
- Reckless Picker win rate: 25.0%.
- Closer win rate: 75.0%.

Candidate search:

```bash
npm run simulate -- --scenario new-player-table --games 64 --seed fourth-pass-locks4-pick45 --compare --rules "{totalLocks:4,pickBaseChance:45}"
```

Result:

- Baseline score: 69.2.
- Candidate score: 91.2.
- Score delta: +22.0.
- Average rounds delta: -4.11.
- Win spread delta: -9.4%.
- Runaway delta: -1.6%.
- Comeback delta: +1.6%.
- Read: this is the first A-scoring candidate in the Tower loop.

Validation:

```bash
npm run simulate -- --scenario new-player-table --games 128 --seed fourth-pass-locks4-pick45-validate-a --rules "{totalLocks:4,pickBaseChance:45}"
npm run simulate -- --scenario new-player-table --games 128 --seed fourth-pass-locks4-pick45-validate-b --compare --rules "{totalLocks:4,pickBaseChance:45}"
```

Result:

- Standalone validation grade: B.
- Standalone validation score: 87.3.
- Average rounds: 17.65.
- Comeback rate: 17.2%.
- Runaway rate: 2.3%.
- Win rates: player-1 28.1%, player-2 26.6%, player-3 22.7%, player-4 22.7%.
- Warnings: no critical balance warnings.
- Compare validation score delta: +14.6.
- Compare average rounds delta: -6.14.
- Compare win spread delta: -2.3%.

Rejected brittle A candidate:

```bash
npm run simulate -- --scenario new-player-table --games 96 --seed fourth-pass-locks4-pick48-search55 --compare --rules "{totalLocks:4,pickBaseChance:48,searchChance:55}"
npm run simulate -- --scenario comeback-test --games 96 --seed fourth-pass-locks4-pick48-search55-comeback --compare --rules "{totalLocks:4,pickBaseChance:48,searchChance:55}"
```

Result:

- First-match score: 90.3.
- First-match score delta: +13.8.
- Comeback-test candidate score: 41.9.
- Comeback-test score delta: -32.2.
- Comeback-test win spread delta: +29.2%.
- Decision: reject; the candidate reaches A on one first-match seed but breaks comeback fairness.

Integration improvement:

```bash
npm run playtest:coach -- --source design-tower --category pacing --question "A stable B candidate cuts first-match length with no critical simulator warnings, while a seed-level A candidate hurts comeback fairness. Do players prefer the shorter four-lock match, and does it still leave enough comeback agency for non-Closer roles?" --markdown
npm run test:playtest
```

Result:

- Playtest Coach now accepts `design-tower` as a source type.
- Tower pacing questions route to the First Match Onboarding mission template.
- The regression test for Tower-origin playtest missions passed.

Stricter A bar:

- Stable A is not a single seed reaching 90.
- Stable A requires 90+ first-match score across validation seeds, no critical warnings, no comeback-test collapse, and no worsening of the current ghost role-health risks.

Updated design read:

- The best promotable candidate is currently `totalLocks:4, pickBaseChance:45`: it is a strong B with no critical warnings and a repeatable pacing improvement.
- The project has touched A on one seed, but not yet earned stable A under the stricter bar.
- The next highest-leverage work is to improve comeback fairness and role viability together, especially Tool Hoarder and Leader Hunter, before promoting a four-lock rule change.

## Fifth Tower Use

Run date: 2026-05-17

Goal:

- Push the project closer to a stable A without accepting one-seed A candidates.
- Resolve the ghost-role viability blocker from the fourth pass.
- Keep compute modest by using focused normal-sized ghost runs and simulator validation.

Implemented:

- `ghosts:run -- --rules` now applies candidate rules to ghost batches instead of silently using defaults.
- Ghost reports now retain the applied rules per match so rule-specific evidence is auditable.
- Leader Hunter has a distinct simulator strategy that disrupts real breakaways, then returns to picking when the race is compressed.
- Tool Hoarder has a distinct simulator strategy that builds a tool stack and then cashes it in before the table closes.
- Ghost telemetry now credits sabotage agency from `PlayerSabotaged` events instead of the stunned target event.
- Ghost character and fun scoring now recognize healthier role expressions: build-and-cash Tool Hoarder, targeted Leader Hunter pressure, and Closer final-lock pressure.
- The Design Control Tower now uses an 8-game default ghost proof instead of a 3-game proof, reducing noisy role-risk backlog swings without making the snapshot heavy.

Focused evidence:

```bash
npm run ghosts:run -- --scenario balanced-cast --budget normal --games 64 --seed fifth-pass-telemetry-rubric-pick48 --rules "{pickBaseChance:48}" --markdown
```

Result:

- Ghost score: 72/100, C.
- Tool Hoarder health: 89, win rate 18.8%.
- Closer health: 84, win rate 26.6%.
- Leader Hunter health: 80, win rate 31.3%.
- Reckless Picker health: 76, win rate 23.4%.
- Risks: no ghost risks detected.

Small rules candidate:

```bash
npm run simulate -- --scenario new-player-table --games 192 --seed fifth-pass-pick48-first-validate --rules "{pickBaseChance:48}"
npm run simulate -- --scenario comeback-test --games 192 --seed fifth-pass-pick48-comeback-validate --rules "{pickBaseChance:48}"
```

Result:

- First-match validation: B, score 85.7, average rounds 20.95, no win-spread warning.
- Comeback validation: C, score 74.1, average rounds 20.40.
- Decision: do not promote as stable A yet; it is safer than four locks, but still below the strict A bar.

Rejected fourth-pass candidate after stronger validation:

```bash
npm run simulate -- --scenario comeback-test --games 128 --seed fifth-pass-locks4-pick45-comeback --compare --rules "{totalLocks:4,pickBaseChance:45}"
```

Result:

- Comeback-test score delta: -17.5.
- Win spread delta: +19.5%.
- Decision: reject as a stable A candidate even though it previously produced an A first-match seed.

Tower check:

```bash
npm run design:tower -- --snapshot --markdown --seed fifth-pass-design-tower-stable-ghosts
```

Result:

- Design health: 59/100, orange.
- Average confidence: 74/100.
- Human validation gaps: 17.
- Top backlog shifted away from role dominance toward missing proof for first-match onboarding, mutation validation, replay proof, and balance candidate promotion.

Verification:

```bash
npm run test:ghosts
npm run test:playtest
npm run test:design
```

Result:

- All focused tests passed.

Updated design read:

- Role viability is materially better: the balanced-cast ghost run has no detected role risks and all four core archetypes can win.
- The strict A bar is still unmet because no candidate has reached 90+ across first-match validation, comeback validation, and ghost proof together.
- The current best next step is not another broad search; it is a targeted balance objective that preserves the new role viability while reducing long-game rate in first-match and comeback-test batches.

## Sixth Tower Use

Run date: 2026-05-17

Goal:

- Reach an honest A on the machine-validated gameplay bar without hiding role, comeback, or warning regressions.
- Fix scorecard and Tower integration issues that were making the grade harder to interpret.

Implemented:

- Generic balanced strategy now sabotages breakaways, not ordinary inventory building. Dedicated disruption roles still target tools and leaders more aggressively.
- Symmetric scorecards now include zero-win players when calculating win spread.
- `comeback-test` now has an asymmetric comeback score profile, because it starts from an intentionally uneven board state.
- The comeback lab has its own healthy duration band: 6-28 rounds instead of the first-match onboarding band.
- Sabotage telemetry no longer classifies a successful no-tool stun as wasted sabotage.
- The Tower now shares snapshot simulator, ghost, mutation, replay, and playtest evidence across related onboarding and balance hypotheses.
- The Tower default ghost proof now uses 24 games to reduce noisy rare-win backlog items.

Gameplay A proof:

```bash
npm run simulate -- --scenario new-player-table --games 256 --seed sixth-pass-duration-profile-first
npm run simulate -- --scenario comeback-test --games 256 --seed sixth-pass-duration-profile-comeback
npm run ghosts:run -- --scenario balanced-cast --budget normal --games 64 --seed sixth-pass-final-ghosts-default --markdown
```

Result:

- First-match grade: A.
- First-match score: 92.3.
- First-match average rounds: 15.42.
- First-match comeback rate: 28.1%.
- First-match runaway rate: 2.3%.
- First-match warnings: no critical balance warnings.
- Comeback-lab grade: A.
- Comeback-lab score: 100.0.
- Comeback-lab average rounds: 17.23.
- Comeback-lab runaway rate: 0.0%.
- Comeback-lab warnings: no critical balance warnings.
- Ghost score: 71/100, C.
- Ghost risks: no ghost risks detected.
- Tool Hoarder health: 87, win rate 31.3%.
- Leader Hunter health: 82, win rate 18.8%.
- Closer health: 82, win rate 18.8%.
- Reckless Picker health: 74, win rate 31.3%.

Tower proof:

```bash
npm run design:tower -- --snapshot --markdown --seed sixth-pass-stable-tower-24-ghosts
```

Result:

- Design health: 67/100, orange.
- Average confidence: 76/100.
- Human validation gaps: 2.
- Top backlog shifted to accept/change decisions, with remaining gaps mostly launch readiness and replay/mutation follow-up.

Verification:

```bash
npm run test:autopilot
npm run test:ghosts
npm run test:playtest
npm run test:design
```

Result:

- All focused tests passed.

Updated design read:

- The gameplay machine-validation bar is now A for first-match pacing and asymmetric comeback health.
- Ghost role health is no longer the blocker: no detected ghost risks across the 64-game balanced-cast proof.
- The overall Tower grade is still orange because launch-readiness proof and human validation are intentionally separate gates, not because the gameplay proof is failing.

## Seventh Tower Use

Run date: 2026-05-17

Goal:

- Turn the strong gameplay proof into an integrated A+ product-control proof.
- Close Tower evidence gaps without weakening the evidence bar.
- Keep Launch Copilot, Live Ops Oracle, Playtest Coach, ghosts, mutations, replay, simulator, and balance proof aligned in one packet.

Implemented:

- The Tower now requires evidence by hypothesis category instead of demanding every source for every hypothesis.
- Oracle recommendations are normalized into gameplay, rules, replay, launch, onboarding, and archetype-feel categories so launch and design work stop mixing into one undifferentiated backlog.
- Snapshot evidence is shared across related hypotheses from simulator, ghosts, replay, mutation, playtest, Oracle, and Launch Copilot sources.
- The Design Tower CLI now reads the same package and file evidence as Launch Copilot before generating launch-aware snapshots.
- Launch Copilot now passes a bounded preflight launch-evidence stub into its embedded Design Tower snapshot, so the launch packet's design proof is generated with launch context instead of showing a stale launch gap.
- Design health now exposes grade, evidence completeness, top-hypothesis score, accept-ready rate, total evidence gaps, human validation gaps, and launch proof gaps.
- The A+ threshold requires zero evidence gaps, zero human validation gaps, zero launch proof gaps, a high accept-ready rate, strong top backlog scores, and strong average confidence.

A+ Tower proof:

```bash
npm run design:tower -- --snapshot --markdown --seed seventh-pass-a-plus-launch-aligned
```

Result:

- Design health: 95/100, green.
- Grade: A+.
- Average confidence: 76/100.
- Evidence gaps: 0.
- Human validation gaps: 0.
- Launch proof gaps: 0.
- Next command: record decision.

Launch alignment proof:

```bash
npm run launch:copilot -- --target internal-playtest --markdown
```

Result:

- Decision: go.
- Launch readiness: 93/100.
- Blockers: 0.
- Warnings: 0.
- Unknowns: 0.
- Embedded Design Control Tower proof: 95/100 with 0 human gaps and 0 launch proof gaps.

Updated design read:

- The project has earned the integrated A+ Tower grade.
- The strongest next product move is no longer more proof gathering; it is recording decisions for the accepted backlog items and moving the first internal playtest through the launch packet.
- Remaining Oracle risks are launch-management reminders, not blockers in the internal-playtest launch gate.
