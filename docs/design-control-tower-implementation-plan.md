# Design Control Tower Implementation Plan

1. Define the superpower as Design Control Tower: one place to manage gameplay hypotheses, evidence, decisions, and shipped design changes.
2. Create `docs/design-control-tower-implementation-plan.md`.
3. Add a new core module: `app/src/lib/designControlTower.js`.
4. Define schema constants: `DESIGN_TOWER_SCHEMA_VERSION`, `DESIGN_TOWER_HYPOTHESIS_KEY`, `DESIGN_TOWER_DECISION_KEY`, `DESIGN_TOWER_PACKET_KEY`.
5. Define hypothesis lifecycle states: `idea`, `queued`, `simulating`, `machine-validated`, `human-playtest`, `accepted`, `rejected`, `shipped`, `archived`.
6. Define evidence source types: `simulator`, `balance-autopilot`, `replay-director`, `ghosts`, `rule-mutation`, `live-ops-oracle`, `launch-copilot`, `playtest-coach`, `manual-note`.
7. Define change categories: `rules`, `onboarding`, `ui`, `pacing`, `balance`, `replay-drama`, `archetype-feel`, `tool-economy`, `sabotage`, `launch-readiness`, `accessibility`.
8. Define a canonical hypothesis object with id, timestamps, title, category, lifecycle state, claim, desired outcome, risk, owner, tags, linked artifacts, evidence, score, decision, next action, and history.
9. Add `createDesignHypothesis(input)`.
10. Add `validateDesignHypothesis(hypothesis)`.
11. Add `migrateDesignHypothesis(hypothesis)`.
12. Add `scoreDesignHypothesis(hypothesis)`.
13. Score hypotheses using evidence strength, player impact, confidence, implementation effort, risk, launch relevance, and recency.
14. Add `rankDesignHypotheses(hypotheses)`.
15. Add `transitionHypothesis(hypothesis, nextState, metadata)`.
16. Add transition validation so invalid lifecycle jumps are blocked.
17. Allow normal paths from idea through queued, simulating, machine validation, human playtest, accepted, shipped, and archived, with rejection from any active state.
18. Add `attachEvidence(hypothesis, evidence)`.
19. Add `validateEvidence(evidence)`.
20. Add evidence scoring rules per source type.
21. Add evidence confidence normalization.
22. Add `summarizeEvidenceStack(hypothesis)`.
23. Add `buildEvidenceGaps(hypothesis)`.
24. Evidence gaps should report missing simulator, ghost, mutation, replay, human playtest, and launch proof.
25. Add `recommendNextDesignAction(hypothesis)`.
26. Recommendations should include simulator, ghosts, mutation matrix, replay proof, playtest mission, acceptance, rejection, shipping, and monitoring.
27. Add `generateDesignTowerSnapshot(config)`.
28. Snapshot should collect from Balance Autopilot, Replay Director, Player Telemetry Ghosts, Rule Mutation Time Machine, Live Ops Oracle, Launch Copilot, and Playtest Coach.
29. Snapshot should run lightweight by default.
30. Snapshot should not run capture jobs by default.
31. Snapshot should accept `heavy: true` for wider machine validation.
32. Add helpers to build hypotheses from Oracle recommendations, mutation reports, ghost risks, playtest reports, and replays.
33. Add `generateDesignBacklog(inputs)`.
34. Backlog should dedupe similar hypotheses by category/title/hash.
35. Backlog should group by highest impact, lowest effort, biggest confidence gap, launch blocker, and human validation needed.
36. Add `generateDecisionMemo(hypothesis)`.
37. Decision memo should include claim, evidence, counterevidence, risks, recommendation, next command, files likely touched, and acceptance criteria.
38. Add `createDesignDecision(hypothesis, decisionInput)`.
39. Decision should require status, operator, rationale, and accepted risks when applicable.
40. Add decision statuses: `accept`, `reject`, `needs-more-data`, `ship`, `rollback`.
41. Add `validateDesignDecision(decision)`.
42. Add local storage functions for hypotheses, decisions, and packets.
43. Add import/export functions for hypotheses, packets, markdown, JSON, and backlog CSV.
44. Add CLI: `app/scripts/design-control-tower.mjs`.
45. CLI flags: `--snapshot`, `--backlog`, `--memo`, `--json`, `--markdown`, `--csv`, `--heavy`, `--out`, `--report`, `--seed`.
46. Add package scripts: `design:tower`, `design:backlog`, `test:design`.
47. Add test file: `app/scripts/test-design-control-tower.mjs`.
48. Tests should cover creation, validation, migrations, scoring, ranking, transitions, invalid transitions, evidence, gaps, recommendations, snapshots, backlog, decisions, exports, and import/export roundtrip.
49. Add generated artifact ignores for `app/reports/design-control`.
50. Add latest report: `docs/design-control-tower-latest.md`.
51. Add developer docs: `docs/dev/design-control-tower.mdx`.
52. Update `docs/dev/index.mdx`.
53. Add app page: `app/src/pages/DesignTowerPage.jsx`.
54. Add route: `/design`.
55. Add nav entry in a persistent grouped nav.
56. Page top section should show totals, accepted/rejected counts, human validation needs, launch blockers, and average confidence.
57. Add hypothesis creator panel.
58. Creator fields should include title, category, claim, desired outcome, risk, owner, and tags.
59. Add evidence intake panel.
60. Evidence intake fields should include source type, summary, confidence, score, artifact id, command, and link/path.
61. Add ranked backlog table.
62. Backlog columns should include rank, title, category, state, score, next action, and evidence count.
63. Add hypothesis detail panel.
64. Detail panel should show lifecycle state, evidence stack, evidence gaps, history, recommended next action, and decision memo.
65. Add lifecycle controls.
66. Controls should only allow valid next states.
67. Add decision controls.
68. Decision controls should require operator and rationale.
69. Add export buttons for markdown memo, JSON packet, and CSV backlog.
70. Add saved library panel.
71. Saved library should show saved hypotheses, decisions, and packets.
72. Integrate Design Control Tower with Live Ops Oracle.
73. Oracle should include design backlog status, top design hypothesis, design confidence score, and human validation gap count.
74. Oracle health weights should include design without pushing total weights over 1.0.
75. Oracle recommendations should be able to generate Design Tower hypotheses.
76. Oracle markdown should include a Design Control section.
77. Integrate Design Control Tower with Launch Copilot.
78. Launch Copilot should check design packet existence, accepted decisions, candidate evidence, and rejected-change protection.
79. Add Launch Copilot proof type: `design-control`.
80. Launch proof should inspect top hypotheses, accepted decisions, unresolved blockers, and packet status.
81. Launch command plan should include `npm run test:design` and `npm run design:tower -- --snapshot --markdown`.
82. Launch required files should include the Design Control Tower library, docs, latest report, and dashboard page.
83. Update Launch dashboard fixture data.
84. Update Launch test fixtures.
85. Add Design Control proof row to Launch page.
86. Integrate Design Control Tower with Playtest Coach.
87. Playtest reports should convert into design evidence.
88. Design hypotheses needing human validation should generate Playtest Coach missions.
89. Add `buildPlaytestMissionFromHypothesis(hypothesis)`.
90. Add `attachPlaytestReportToHypothesis(hypothesis, report)`.
91. Integrate with Rule Mutation Time Machine.
92. Mutation reports should create hypotheses for accepted/rejected rule changes.
93. Add `buildHypothesisFromMutationCandidate(report)`.
94. Add `buildMutationEvidence(report)`.
95. Integrate with Player Telemetry Ghosts.
96. Ghost risks should become hypotheses.
97. Ghost improvements should become evidence.
98. Add `buildGhostEvidence(report)`.
99. Integrate with Replay Director.
100. Replay proof should attach to hypotheses as drama/shareability evidence.
101. Add `buildReplayEvidence(replay)`.
102. Integrate with Balance Autopilot.
103. Balance candidates should become hypotheses.
104. Autopilot score deltas should become evidence.
105. Add `buildBalanceEvidence(autopilotResult)`.
106. Add snapshot generation from all systems.
107. Snapshot should produce top hypotheses, evidence gaps, recommended commands, accepted changes, rejected changes, and launch-sensitive changes.
108. Add markdown packet export.
109. Packet sections should include health, top backlog, accepted changes, rejected changes, evidence gaps, next commands, and decision memos.
110. Add CSV backlog export.
111. CSV columns should include rank, id, title, category, state, score, confidence, effort, next action, and evidence sources.
112. Add JSON export.
113. JSON export should include schema version.
114. Add migration support.
115. Add storage cap to prevent localStorage bloat.
116. Add deterministic IDs from content hash.
117. Add deterministic sample fixture data for the dashboard.
118. Keep all default dashboard runs lightweight.
119. Avoid broad simulations inside render paths.
120. Memoize generated snapshots.
121. Ensure no generated artifact is committed except latest docs.
122. Add CI step: `npm run test:design`.
123. Add CI smoke: `npm run design:tower -- --snapshot --markdown`.
124. Run local verification: `npm run test:design`, `npm run test:oracle`, `npm run test:launch`, `npm run test:playtest`, `npm run design:tower -- --snapshot --markdown`, `npm run build`.
125. Start dev server if needed.
126. Route-check `/design`, `/playtest`, `/launch`, and `/ops`.
127. Inspect nav layout after adding `/design`.
128. Confirm no overlap on desktop.
129. Confirm grouped mobile nav remains readable.
130. Scan new files for unfinished-work markers.
131. Fix any unfinished-work marker found in new files.
132. Update latest report with verification results.
133. Final deliverable should include implementation plan path, new route, scripts, tests run, build result, and any remaining warnings.
