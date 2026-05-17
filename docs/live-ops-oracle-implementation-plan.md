# Live Ops Oracle Implementation Plan

Date: 2026-05-14

This is the full sequential plan for turning the simulator, Balance Autopilot, Replay Director, docs, and release readiness into an operational command center.

1. Define Live Ops Oracle's job.
2. Define the core Oracle output object.
3. Create a dedicated module.
4. Keep it as an orchestration layer.
5. Define source types.
6. Define health categories.
7. Define recommendation shape.
8. Define risk shape.
9. Define opportunity shape.
10. Define release readiness shape.
11. Define marketing proof shape.
12. Define experiment lifecycle.
13. Define replay lifecycle.
14. Define release gates.
15. Define scoring weights.
16. Add `generateOracleReport(config)`.
17. Add `collectOracleSources(config)`.
18. Add a no-heavy-default policy.
19. Add explicit heavy mode.
20. Add source freshness checks.
21. Add local report discovery.
22. Add optional file summary ingestion.
23. Add checklist parser.
24. Add release checklist parser.
25. Add readiness scoring from checklist completion.
26. Add balance status analyzer.
27. Add replay status analyzer.
28. Add simulator status analyzer.
29. Add docs status analyzer.
30. Add marketing proof analyzer.
31. Add operations analyzer.
32. Add live data analyzer stub.
33. Add telemetry hook placeholders.
34. Add simulator-vs-live comparison shape.
35. Add recommendation engine.
36. Add recommendation scoring.
37. Add impact scale.
38. Add effort scale.
39. Add confidence scale.
40. Add urgency scale.
41. Add recommendation categories.
42. Add automated recommendation templates.
43. Add risk detection.
44. Add opportunity detection.
45. Add action plan builder.
46. Add command suggestions.
47. Add file suggestions.
48. Add owner labels.
49. Add due-date hints.
50. Add report severity labels.
51. Add overall health score.
52. Add health explanation.
53. Add release note generator.
54. Add marketing proof bundle generator.
55. Add social hook generator.
56. Add press hook generator.
57. Add daily brief Markdown export.
58. Add JSON export.
59. Add CSV export for recommendations.
60. Add release notes export.
61. Add marketing bundle export.
62. Add CLI script.
63. Add package script.
64. Add CLI commands.
65. Add output directory.
66. Add `.gitignore` for large generated JSON if needed.
67. Add committed latest snapshot.
68. Add docs page.
69. Add browser page.
70. Add dashboard layout.
71. Add status cards.
72. Add recommendation table.
73. Add risk table.
74. Add opportunity table.
75. Add action-plan lanes.
76. Add command copy buttons.
77. Add export buttons.
78. Add refresh button.
79. Add heavy-mode warning.
80. Add localStorage notes.
81. Add manual operator notes input.
82. Add saved daily snapshots.
83. Add import/export snapshots.
84. Add status trend stub.
85. Add route health check integration.
86. Add script health check integration.
87. Add docs freshness display.
88. Add report freshness display.
89. Add proof asset display.
90. Add replay proof strip.
91. Add balance candidate strip.
92. Add next-best-command prominent button.
93. Add copy daily brief button.
94. Add copy release notes button.
95. Add copy marketing bundle button.
96. Add tests for checklist parser.
97. Add tests for recommendation ranking.
98. Add tests for risk detection.
99. Add tests for markdown export.
100. Add tests for marketing bundle export.
101. Add tests for release notes export.
102. Add tests for source freshness.
103. Add CLI smoke test.
104. Add CI workflow step.
105. Add no-heavy CI mode.
106. Add performance guardrails.
107. Add report schema version.
108. Add migration helper.
109. Add snapshot validation.
110. Add local snapshot library.
111. Add operator decision log.
112. Add candidate lifecycle bridge.
113. Add replay lifecycle bridge.
114. Add release gate recommendation.
115. Add live-data readiness checklist.
116. Add future live event ingestion adapter.
117. Add simulator-vs-live drift report.
118. Add player archetype drift report.
119. Add retention/funnel slots.
120. Add deployment readiness slots.
121. Add website integration checklist.
122. Add marketing proof deployment checklist.
123. Add recurring scheduled report workflow later.
124. Add Slack/email/webhook export later.
125. Add Oracle score to project report card.
