# Rule Mutation Time Machine Implementation Plan

1. Define the superpower as one system for comparing baseline rules against mutated rules across simulator outcomes, replay drama, ghost archetypes, balance metrics, Oracle readiness, and launch risk.
2. Create `app/src/lib/ruleMutationTimeMachine.js`.
3. Define `MUTATION_SCHEMA_VERSION = 1`.
4. Define storage keys for sessions, reports, and pinned candidates.
5. Define mutation sources: manual rule edit, replay seed, ghost cast, balance candidate, launch packet, and preset experiment.
6. Define comparison dimensions: outcome, pacing, tension, fairness, replay drama, ghost archetype health, launch readiness, contract impact, and player agency.
7. Define mutation presets: faster games, slower games, more comeback, less sabotage fatigue, more tool economy, less tool hoarding, clutch endings, safer onboarding, high drama, and contract-minimal.
8. For each preset define id, label, description, rule patch, intended effect, expected risk, and contract impact estimate.
9. Add rule patch utilities: `applyRulePatch`, `diffRules`, `invertRulePatch`, and `describeRuleDiff`.
10. Add rule validation by clamping to simulator bounds, rejecting invalid numeric values, and normalizing with `normalizeRuleset`.
11. Add `getRuleContractImpact`.
12. Add `buildMutationScenario`.
13. Add `runRuleMutationComparison`.
14. Run baseline simulation, candidate simulation, baseline replay, candidate replay, baseline ghost match when a roster or ghost scenario exists, and candidate ghost match under the same conditions.
15. Use the same seed for baseline and candidate.
16. Use the same strategies or ghost roster for baseline and candidate.
17. Never use a separate game model.
18. Add `compareSimulationSummaries`.
19. Compare winner, rounds, completion, comeback, runaway, lead changes, average tension, near-win moments, stun moments, action counts, and action values.
20. Add `compareTensionCurves`.
21. Output per-round baseline tension, candidate tension, delta, biggest divergence round, average delta, and ending tension delta.
22. Add `compareReplayDrama`.
23. Compare dramatic score, highlight count, top highlight type, marketing usability, story beat count, and best capture frame.
24. Add `compareGhostHealth`.
25. Compare overall ghost score, archetype health deltas, win-rate deltas, frustration deltas, stayed-in-character deltas, healthiest archetype changed, and riskiest archetype changed.
26. Add `scoreMutationImpact`.
27. Include fun delta, pacing delta, fairness delta, drama delta, ghost health delta, frustration delta, contract risk penalty, and launch readiness penalty.
28. Add verdicts: ship candidate, playtest candidate, investigate, risky, and reject.
29. Add `buildMutationRecommendation`.
30. Explain what improved, what regressed, which archetypes changed, whether deeper validation is needed, and whether contract work is required.
31. Add `generateMutationReport`.
32. Include scenario metadata, baseline rules, candidate rules, rule diff, contract impact, simulation comparison, tension comparison, replay comparison, ghost comparison, score, verdict, recommendations, replay links, and rollback patch.
33. Add `generateMutationMatrix`.
34. Matrix runs multiple presets against the same baseline.
35. Keep default matrix lightweight.
36. Add budget levels: smoke, normal, and deep.
37. Smoke budget uses one seed, a small preset list, optional ghost roster, and no capture.
38. Normal budget uses multiple seeds, all presets, ghost reports, and replay comparisons.
39. Deep budget requires explicit CLI flag.
40. Add exports: Markdown report, JSON report, mutation matrix CSV, and rule diff CSV.
41. Add validation for scenarios, comparisons, and reports.
42. Add migration.
43. Add browser storage helpers for sessions, reports, pinned candidates, and report import/export.
44. Add `app/scripts/rule-mutation-time-machine.mjs`.
45. Add package scripts: `mutate:rules`, `mutate:matrix`, and `test:mutations`.
46. Add CLI flags for preset, matrix, seed, scenario, ghost scenario, budget, rules, patch, json, markdown, csv, and out.
47. Make CLI default run a smoke comparison.
48. Prevent deep mode unless explicitly requested.
49. CLI prints verdict, score, changed rules, winner delta, round delta, drama delta, ghost score delta, contract impact, and recommendation.
50. Add tests for patching, diff generation, contract impact, deterministic comparison, replay comparison, ghost comparison, score/verdict, matrix generation, exports, storage-safe helpers, and no secret leakage.
51. Add `app/scripts/test-rule-mutation-time-machine.mjs`.
52. Integrate with simulator page through a send-to-Time-Machine URL contract.
53. Integrate with Replay Director with mutation metadata helpers.
54. Integrate with Player Telemetry Ghosts through cast-preserving mutation comparison.
55. Integrate with Balance Autopilot with mutation reports for top candidates.
56. Integrate with Live Ops Oracle with best, worst, safest, highest-drama, and lowest-frustration mutation signals.
57. Integrate with Launch Copilot with mutation smoke checks, rollback patch proof, and contract-impact launch evidence.
58. Add `docs/dev/rule-mutation-time-machine.mdx`.
59. Add `docs/rule-mutation-time-machine-latest.md`.
60. Update docs index.
61. Add `app/src/pages/MutationsPage.jsx`.
62. Add route `/mutations`.
63. Add nav item `Mutations`.
64. Dashboard shows baseline rules, candidate rules, presets, comparison controls, matrix controls, verdict, score breakdown, rule diff table, tension chart, replay comparison, ghost deltas, contract impact, recommendations, pinned candidates, saved reports, exports, copy patch, copy rollback patch, and handoff actions.
65. Add rule editor controls for total locks, max tools, pick base chance, pick tool bonus, pick chance cap, search chance, and stunned search chance.
66. Add preset buttons for all mutation presets.
67. Add matrix table.
68. Add `.gitignore` entries for mutation reports.
69. Update CI smoke with mutation tests and smoke CLI.
70. Generate first smoke report.
71. Save first report to docs.
72. Run tests.
73. Run CLI smoke.
74. Run build.
75. Check `/mutations` route.
76. Check no placeholder markers.
77. Confirm all mutation comparisons use the exact same simulator engine.
78. Confirm deep runs are opt-in only.
79. Confirm no media capture is triggered by default.
80. Final outcome: Plundrix can answer what changed and why for rule mutations across gameplay, replay, ghosts, balance, Oracle, and launch readiness.
