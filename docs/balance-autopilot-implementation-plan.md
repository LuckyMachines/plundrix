# Balance Autopilot Implementation Plan

Date: 2026-05-14

This is the full sequential plan for turning the Plundrix simulator into an auto-balance discovery system.

1. Define the optimization goal.
2. Create a dedicated autopilot module.
3. Define a candidate ruleset shape.
4. Separate contract constants from tunable lab values.
5. Define hard safety bounds for every knob.
6. Define step sizes for each knob.
7. Add candidate generation helpers.
8. Add deterministic randomness for the autopilot itself.
9. Add an `evaluateCandidate()` function.
10. Store full evaluation output.
11. Create the objective scoring function.
12. Make the scoring transparent.
13. Add minimum viability filters.
14. Add support for evaluating multiple scenarios.
15. Aggregate multi-scenario scores.
16. Weight scenarios.
17. Add a simple first search mode: random search.
18. Add second search mode: local hill climb.
19. Add third search mode: beam search.
20. Add fourth search mode: grid search with limits.
21. Add a budget system.
22. Add progress reporting.
23. Add cancellation support for browser runs.
24. Add browser-safe chunking.
25. Add a Web Worker for heavy search.
26. Move candidate evaluation into the worker.
27. Keep the CLI and browser using the same autopilot module.
28. Add CLI script.
29. Add package script.
30. Support CLI arguments.
31. Add CLI JSON output.
32. Add CLI CSV output.
33. Add Markdown report output.
34. Include top candidates in the report.
35. Include do-not-ship candidates.
36. Add baseline comparison.
37. Add improvement delta.
38. Add smallest-change ranking.
39. Penalize overfitting.
40. Track scenario variance.
41. Add dominance detection.
42. Add strategy matchup matrix.
43. Add player-order fairness check.
44. Add seat rotation helper.
45. Aggregate rotated results.
46. Add confidence levels.
47. Add rerank pass.
48. Add final validation pass.
49. Add seed bank.
50. Add find-exciting-seeds mode.
51. Add find-broken-seeds mode.
52. Add seed replay links to reports.
53. Add browser UI entry point.
54. Add search controls.
55. Add objective presets.
56. Add knob-locking UI.
57. Add bounds editing UI.
58. Add live progress panel.
59. Add top candidates table.
60. Add candidate detail drawer.
61. Add apply-candidate-to-lab button.
62. Add compare-candidate button.
63. Add replay-candidate-seed button.
64. Add copy-rules-JSON button.
65. Add export-autopilot-report button.
66. Add generated report route or file output.
67. Add `.gitignore` entry for large generated reports if needed.
68. Add summarized committed report.
69. Add tests for candidate generation.
70. Add tests for objective scoring.
71. Add tests for scenario aggregation.
72. Add tests for seat rotation.
73. Add tests for CLI argument parsing.
74. Add tests for CSV/Markdown report formatting.
75. Add a smoke test for `simulate:auto-balance`.
76. Add performance guardrails.
77. Add browser warning for deep searches.
78. Add worker timeout handling.
79. Add resumable search state.
80. Add candidate deduplication.
81. Add hash IDs for candidates.
82. Add top-candidate cache.
83. Add export schema version.
84. Add contract-version metadata.
85. Add ship-readiness label.
86. Add risk explanations.
87. Add candidate clustering.
88. Add representative candidates.
89. Add Pareto frontier.
90. Add minimal viable patch selector.
91. Add contract-compatible-now mode.
92. Add future-contract mode.
93. Add soft-tuning mode.
94. Add hard-tuning mode.
95. Add report section for implementation cost.
96. Add Solidity patch suggestion output.
97. Add warning that deployed contract behavior remains unchanged until contract upgrade or redeploy.
98. Add a `docs/dev/balance-autopilot.mdx` page.
99. Add examples.
100. Add interpretation guide.
101. Add known limitations.
102. Add how-to-promote-a-candidate workflow.
103. Add CI smoke check.
104. Add CI threshold only for tool health, not game balance yet.
105. Add optional balance baseline snapshots.
106. Add regression checks later.
107. Add nightly deep search later.
108. Add artifact upload for nightly reports.
109. Add report diffing.
110. Add balance changelog.
111. Add browser-side saved experiments.
112. Add import experiment JSON.
113. Add candidate pinning.
114. Add candidate notes.
115. Add subjective playtest fields.
116. Add sim-score-vs-human-feel comparison.
117. Add telemetry hook placeholders.
118. Add live-data calibration mode.
119. Add player archetype fitting.
120. Add realistic ladder simulation.
121. Add long-term meta simulation.
122. Add exploit search.
123. Add adversarial strategy generation.
124. Add anti-dominance score.
125. Add candidate promotion workflow.
