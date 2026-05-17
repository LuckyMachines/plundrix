# Player Telemetry Ghosts Implementation Plan

1. Define the superpower clearly: Plundrix can generate, detect, label, replay, compare, and tune around player archetypes across simulator, replay, Oracle, launch, and future live data.
2. Create `app/src/lib/playerTelemetryGhosts.js`.
3. Define `GHOST_SCHEMA_VERSION = 1`.
4. Define canonical archetype IDs: reckless picker, tool hoarder, revenge saboteur, leader hunter, comeback hunter, stall breaker, chaos agent, safe builder, opportunist, and closer.
5. For each archetype define id, label, description, motivation, preferred actions, risk tolerance, early/mid/end behavior, fun risks, and balance risks.
6. Add strategy profiles that map into the existing simulator strategy system.
7. Add `buildGhostProfile(archetypeId, options)`.
8. Add deterministic ghost names.
9. Add `generateGhostRoster(seed, count, options)`.
10. Keep rosters deterministic from seed for repeatable replay, sim, and CLI output.
11. Add `ghostToSimulatorStrategy(ghost)`.
12. Add `ghostToStrategyProfile(ghost)`.
13. Extend simulator use through wrapper functions, without breaking current simulator calls.
14. Add `runGhostMatch(options)`.
15. Add `runGhostBatch(options)`.
16. Add `analyzeGhostBehavior(state, ghostRoster)`.
17. Compute per-player pick rate, search rate, sabotage rate, successes, failed picks, target patterns, tool hoarding, stunned rounds, near victory rounds, comeback attempts, leader targeting, and endgame aggression.
18. Add `inferGhostArchetype(playerTelemetry)`.
19. Compare declared archetype versus observed archetype.
20. Add stayed-in-character scoring.
21. Add per-ghost fun contribution scoring.
22. Add per-ghost frustration risk scoring.
23. Add `scoreGhostMatch(batchResult)`.
24. Output archetype win rate, placement, fun contribution, frustration risk, game length, best matchup, and worst matchup.
25. Add matchup analysis for key cast combinations.
26. Add `GHOST_SCENARIOS`: balanced cast, sabotage den, greedy table, new-player ghosts, comeback lab, stall-risk lab, and high-drama cast.
27. Add JSON, Markdown, CSV, roster export, roster import, validation, and migration helpers.
28. Add browser storage keys for rosters, reports, and pinned ghosts.
29. Add `app/scripts/player-telemetry-ghosts.mjs`.
30. Add package scripts: `ghosts:run`, `ghosts:report`, and `test:ghosts`.
31. Add CLI flags for scenario, seed, games, roster, json, markdown, csv, out, and budget.
32. Keep the default CLI run lightweight.
33. Add `app/scripts/test-player-telemetry-ghosts.mjs`.
34. Test deterministic rosters, validation, match runs, reports, inferred archetypes, exports, and no secret leakage.
35. Integrate with Replay Director by adding ghost metadata, ghost highlights, and ghost story text.
36. Integrate with Balance Autopilot by adding ghost scenarios, ghost balance score, archetype viability, and tuning recommendations.
37. Integrate with Live Ops Oracle by adding Ghosts health, risks, and recommended actions.
38. Integrate with Launch Copilot by adding launch gate checks and packet proof for ghost smoke reports.
39. Add `app/src/pages/GhostsPage.jsx`.
40. Add route `/ghosts`.
41. Add nav item `Ghosts`.
42. Dashboard first screen shows roster generator, scenario picker, smoke batch, archetype health, matchup matrix, best replay proof, and tuning recommendations.
43. Add roster editor controls for archetype, name, aggression, greed, sabotage, risk tolerance, clutch behavior, and target preference.
44. Add generate, run smoke, run batch, export, replay, balance, and pin actions.
45. Add ghost cards, matchup matrix, and best story panel.
46. Add `docs/dev/player-telemetry-ghosts.mdx`.
47. Add `docs/player-telemetry-ghosts-latest.md`.
48. Update docs index.
49. Update CI smoke with `npm run test:ghosts` and `npm run ghosts:run -- --budget smoke --markdown`.
50. Add `.gitignore` entries for `app/reports/ghosts/*.json`, `*.csv`, and `*.md`.
51. Generate the first smoke report and save it to docs.
52. Run tests.
53. Run CLI smoke.
54. Run build.
55. Check `/ghosts` route.
56. Check no placeholder markers in new Ghosts files.
57. Confirm every ghost system uses the same simulator engine, not a separate game model.
58. Keep all expensive runs opt-in.
59. Make deep runs require an explicit flag.
60. Final result: Plundrix has a living test cast that makes balance, replay, launch, and gameplay tuning feel human instead of abstract.
