# Product Gap Implementation Plan

Generated: 2026-05-18

This plan turns the current project gaps into a sequential implementation track. Each item includes an owner, status, verification path, evidence artifact, and exit criteria so the work can be completed and re-graded without relying on memory.

## Status Key

- Pending: not started.
- In progress: implementation has begun.
- Blocked external: requires real testers, production credentials, deployment access, or a product decision.
- Complete: implemented and verified.

## Ordered Checklist

1. Complete - Create this master gap tracker.
   - Owner: product/engineering.
   - Verification: `git grep "Product Gap Implementation Plan" docs/product-gap-implementation-plan.md`.
   - Evidence artifact: `docs/product-gap-implementation-plan.md`.
   - Exit criteria: every known gap has a sequenced implementation path.

2. Complete - Add durable decision records.
   - Owner: product/engineering.
   - Verification: `npm run design:tower -- --snapshot --markdown`.
   - Evidence artifact: `docs/decisions/*.md` and `app/reports/design-control/decisions/*.json`.
   - Exit criteria: top accepted Tower backlog items have explicit decisions, evidence, accepted risks, rejected alternatives, and follow-up validation.

3. Complete - Add a decision-record CLI.
   - Owner: engineering.
   - Verification: `npm run design:decision -- --status accept --operator codex --rationale "..." --risks "..."`.
   - Evidence artifact: generated decision markdown and JSON.
   - Exit criteria: invalid decisions fail fast and valid decisions are written deterministically.

4. Complete - Update Design Tower to read decision records.
   - Owner: engineering.
   - Verification: `npm run test:design`.
   - Evidence artifact: Design Tower packet with recorded and missing decision counts.
   - Exit criteria: next actions name the exact missing decision command instead of the generic `record decision`.

5. Complete - Re-run Tower after decision records.
   - Owner: product/engineering.
   - Verification: `npm run design:tower -- --snapshot --markdown`.
   - Evidence artifact: `docs/design-control-tower-latest.md`.
   - Exit criteria: grade remains A+ and top accepted items show recorded decisions.

6. Complete - Create real human playtest protocol.
   - Owner: product/research.
   - Verification: review `docs/playtests/internal-playtest-protocol.md`.
   - Evidence artifact: moderator protocol and observation rubric.
   - Exit criteria: a facilitator can run the session without extra explanation.

7. Complete - Add playtest session data format.
   - Owner: engineering/research.
   - Verification: `npm run test:playtest`.
   - Evidence artifact: `app/data/playtests/schema.json`.
   - Exit criteria: session notes can be normalized without personal data.

8. Complete - Add playtest report importer.
   - Owner: engineering.
   - Verification: `npm run playtest:import -- --file app/data/playtests/sample-session.json --markdown`.
   - Evidence artifact: normalized report JSON and markdown.
   - Exit criteria: imported real sessions feed Playtest Coach and Design Tower evidence.

9. Complete - Update Playtest Coach to distinguish synthetic, facilitated, and live-session evidence.
   - Owner: engineering/research.
   - Verification: `npm run test:playtest && npm run test:design`.
   - Evidence artifact: Playtest report with evidence type and confidence.
   - Exit criteria: Oracle human-evidence warnings only clear when real or facilitated evidence exists.

10. Blocked external - Run first internal playtest batch.
    - Owner: product/research.
    - Verification: imported results from at least 4 testers.
    - Evidence artifact: anonymized playtest session files.
    - Exit criteria: first-match onboarding, Tool Hoarder, mutation A/B, and replay memory are observed with real people.

11. Blocked external - Import and attach playtest results.
    - Owner: product/engineering.
    - Verification: `npm run playtest:import -- --file <results> && npm run design:tower -- --snapshot --markdown`.
    - Evidence artifact: Playtest report and Tower packet.
    - Exit criteria: Tool Hoarder uncertainty becomes accept, reject, or hold.

12. Complete - Promote mainnet/release checklist into executable gates.
    - Owner: engineering/ops.
    - Verification: `npm run test:launch`.
    - Evidence artifact: structured launch checks from `docs/go-live-checklist.md`.
    - Exit criteria: every critical checklist item is pass, warn, fail, blocked, or skipped with evidence.

13. Complete - Create release environment template.
    - Owner: engineering/ops.
    - Verification: review `docs/release-env-template.md` and `.env.mainnet.example`.
    - Evidence artifact: release environment templates.
    - Exit criteria: operators know every required launch value.

14. Complete - Add launch readiness override file.
    - Owner: ops.
    - Verification: `npm run launch:copilot -- --target launch-candidate --markdown`.
    - Evidence artifact: `ops/launch-readiness.json`.
    - Exit criteria: manual confirmations are explicit and machine-readable.

15. Complete - Update Launch Copilot to use manual release confirmations.
    - Owner: engineering/ops.
    - Verification: `npm run test:launch`.
    - Evidence artifact: launch packet with exact missing confirmation fields.
    - Exit criteria: manual launch blockers become actionable field-level failures.

16. Complete - Add contract deployment rehearsal script.
    - Owner: engineering/ops.
    - Verification: `npm run launch:rehearse-contracts`.
    - Evidence artifact: contract rehearsal report.
    - Exit criteria: env, deploy target, ABI, and config compatibility are checked before production.

17. Complete - Add frontend config validation.
    - Owner: engineering.
    - Verification: `npm run launch:check-config`.
    - Evidence artifact: config validation output.
    - Exit criteria: contract, chain, ABI, network, and RPC mismatches fail fast.

18. Complete - Add agent-service readiness check.
    - Owner: engineering/ops.
    - Verification: `npm run launch:check-agent`.
    - Evidence artifact: agent readiness output.
    - Exit criteria: agent URL, health, chain id, and contract address are verified or clearly skipped.

19. Complete - Add pause/unpause rehearsal proof.
    - Owner: engineering/ops.
    - Verification: `npm run launch:rehearse-contracts -- --include-pause`.
    - Evidence artifact: pause rehearsal report.
    - Exit criteria: pause and unpause are proven on the intended environment or marked manual-blocked.

20. Blocked external - Run launch candidate packet.
    - Owner: ops.
    - Verification: `npm run launch:copilot -- --target launch-candidate --markdown`.
    - Evidence artifact: launch candidate packet.
    - Exit criteria: remaining blockers are only real external production decisions or credentials.

21. Complete - Design live event schema.
    - Owner: engineering/data.
    - Verification: review `docs/dev/live-events.mdx`.
    - Evidence artifact: event schema docs.
    - Exit criteria: every major game event has a documented shape.

22. Complete - Add local event collector abstraction.
    - Owner: engineering/data.
    - Verification: `npm run test:telemetry`.
    - Evidence artifact: `app/src/lib/liveTelemetry.js`.
    - Exit criteria: local events normalize and summarize consistently.

23. Complete - Wire live telemetry into game session flow.
    - Owner: engineering.
    - Verification: `npm run test:telemetry && npm run build`.
    - Evidence artifact: event emissions from player actions and game completion.
    - Exit criteria: local sessions produce analyzable telemetry.

24. Complete - Add live telemetry dashboard panel.
    - Owner: engineering/product.
    - Verification: `/ops` renders telemetry health.
    - Evidence artifact: Ops dashboard telemetry section.
    - Exit criteria: operators can see session count, completion, actions, stuns, comeback rate, and replay-worthy games.

25. Complete - Update Live Ops Oracle to consume telemetry.
    - Owner: engineering/data.
    - Verification: `npm run test:oracle`.
    - Evidence artifact: Oracle report with telemetry confidence.
    - Exit criteria: no-live-data warning changes when local or production telemetry exists.

26. Complete - Add telemetry fixture tests.
    - Owner: engineering.
    - Verification: `npm run test:telemetry`.
    - Evidence artifact: telemetry fixture tests.
    - Exit criteria: normalization, summary math, missing events, and Oracle integration are covered.

27. Pending - Run normal balance validation.
    - Owner: design/engineering.
    - Verification: `npm run simulate:auto-balance -- --mode beam --budget normal --objective default`.
    - Evidence artifact: `docs/balance-autopilot-latest.md`.
    - Exit criteria: latest balance proof is normal-budget, not smoke-only.

28. Complete - Add stricter balance promotion criteria.
    - Owner: design/engineering.
    - Verification: `npm run test:autopilot`.
    - Evidence artifact: promotion gate report.
    - Exit criteria: candidates cannot promote without first-match, comeback, warning, ghost, replay, mutation, and launch proof.

29. Complete - Update Balance Autopilot with promotion gate.
    - Owner: engineering/design.
    - Verification: `npm run test:autopilot`.
    - Evidence artifact: candidate promotable, hold, or reject result.
    - Exit criteria: failed criteria are exact and actionable.

30. Complete - Add cross-system balance matrix.
    - Owner: engineering/design.
    - Verification: `npm run balance:matrix`.
    - Evidence artifact: cross-system balance matrix markdown.
    - Exit criteria: simulator, comeback, ghosts, replay, mutations, and launch risk are compared together.

31. Pending - Improve ghost scoring from C to B/A.
    - Owner: design/engineering.
    - Verification: `npm run ghosts:run -- --scenario balanced-cast --budget normal --games 128 --markdown`.
    - Evidence artifact: ghost archetype health report.
    - Exit criteria: no archetype is weak and overall score reaches B or better without hiding role risks.

32. Complete - Add Tool Hoarder focused validation.
    - Owner: design/research.
    - Verification: `npm run ghosts:tool-hoarder -- --budget normal --games 128 --seed tool-hoarder-validation`.
    - Evidence artifact: Tool Hoarder validation report.
    - Exit criteria: Tool Hoarder is accepted, rejected, or held with evidence.

33. Complete - Add archetype fairness report.
    - Owner: design/engineering.
    - Verification: `npm run test:ghosts`.
    - Evidence artifact: ghost fairness metrics.
    - Exit criteria: each archetype explains win viability, agency, frustration, stun exposure, sabotage use, and tool waste.

34. Blocked external - Run real Tool Hoarder playtest.
    - Owner: product/research.
    - Verification: imported Tool Hoarder playtest sessions.
    - Evidence artifact: anonymized session reports.
    - Exit criteria: human testers confirm whether Tool Hoarder feels clever, oppressive, fair, and counterable.

35. Pending - Update rules if Tool Hoarder is unhealthy.
    - Owner: design/engineering.
    - Verification: `npm run balance:matrix`.
    - Evidence artifact: accepted rule change decision.
    - Exit criteria: any rule change improves Tool Hoarder health without hurting first-match, comeback, replay, ghosts, or launch risk.

36. Pending - Create replay capture pipeline.
    - Owner: engineering/marketing.
    - Verification: `npm run replay:capture -- --seed proof-capture --output app/public/replays/proof.png`.
    - Evidence artifact: replay poster or clip.
    - Exit criteria: replay proof can be captured repeatably.

37. Pending - Add replay gallery curation file.
    - Owner: product/marketing.
    - Verification: `npm run build`.
    - Evidence artifact: curated replay gallery data.
    - Exit criteria: generated proof and curated proof are distinct.

38. Pending - Add marketing proof strip.
    - Owner: product/engineering.
    - Verification: screenshot and build.
    - Evidence artifact: homepage or site proof strip.
    - Exit criteria: real replay proof is visible without generic claims.

39. Pending - Add share-card generator.
    - Owner: engineering/marketing.
    - Verification: `npm run replay:capture -- --share-card`.
    - Evidence artifact: static share-card images.
    - Exit criteria: comeback, sabotage, and Tool Hoarder proof cards can be generated.

40. Pending - Run visual screenshot pass.
    - Owner: design/engineering.
    - Verification: repeatable screenshots with dummy data.
    - Evidence artifact: visual audit report.
    - Exit criteria: Home, Simulator, Replay, Design Tower, Launch, and Ops screenshots are current.

41. Pending - Add local end-to-end launch rehearsal.
    - Owner: engineering/ops.
    - Verification: `npm run launch:rehearse-local`.
    - Evidence artifact: local launch rehearsal report.
    - Exit criteria: build, server, routes, simulator, replay, Launch Copilot, Oracle, and cleanup run from one command.

42. Pending - Add wallet/contract rehearsal path.
    - Owner: engineering/ops.
    - Verification: `npm run launch:rehearse-local -- --contracts`.
    - Evidence artifact: wallet/contract rehearsal report.
    - Exit criteria: local chain proof runs or is skipped with an exact missing prerequisite.

43. Pending - Update Launch Copilot with rehearsal evidence.
    - Owner: engineering/ops.
    - Verification: `npm run test:launch`.
    - Evidence artifact: launch packet proof bundle.
    - Exit criteria: route, build, contract, wallet, and rollback proof are separated by gate.

44. Pending - Create release decision log.
    - Owner: ops/product.
    - Verification: review `docs/release-decisions/*.md`.
    - Evidence artifact: gate decision records.
    - Exit criteria: internal playtest, public testnet, launch candidate, and mainnet decisions link to launch packets.

45. Pending - Run full verification suite.
    - Owner: engineering.
    - Verification: all project scripts and build pass.
    - Evidence artifact: verification notes in latest docs.
    - Exit criteria: core tests, new tests, config checks, and build pass.

46. Pending - Refresh latest docs.
    - Owner: engineering/product.
    - Verification: review latest docs.
    - Evidence artifact: latest markdown snapshots.
    - Exit criteria: docs match the current implementation and proof.

47. Pending - Re-grade with stricter bars.
    - Owner: product/engineering.
    - Verification: report card snapshot.
    - Evidence artifact: updated report card section in this file or latest docs.
    - Exit criteria: every remaining non-A surface has a concrete blocker or next command.

48. Pending - Commit cleanly.
    - Owner: engineering.
    - Verification: `git diff --check && git status --short`.
    - Evidence artifact: Git commit.
    - Exit criteria: source/docs are committed and generated artifacts remain ignored.

49. Pending - Push.
    - Owner: engineering.
    - Verification: `git rev-list --left-right --count HEAD...'@{u}'`.
    - Evidence artifact: pushed branch.
    - Exit criteria: local and remote are even.

50. Pending - Confirm final success criteria.
    - Owner: product/engineering.
    - Verification: clean repo, A+ Tower, improved Oracle, launch packet, and latest docs.
    - Evidence artifact: final summary.
    - Exit criteria: remaining blockers are explicit external dependencies, not missing implementation.
