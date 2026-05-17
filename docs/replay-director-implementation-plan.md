# Replay Director Implementation Plan

Date: 2026-05-14

This is the full sequential plan for turning simulator outcomes into replayable, shareable gameplay stories.

1. Define Replay Director's job clearly.
2. Define the core output object.
3. Create a dedicated replay module.
4. Keep it dependent on the simulator engine only.
5. Add replay ID generation.
6. Add replay source types.
7. Add `buildReplayFromSimulation(state)`.
8. Add `buildReplayFromSeed(config)`.
9. Add `buildReplaysFromBatch(batchResult)`.
10. Add `buildReplaysFromAutopilot(report)`.
11. Add a replay timeline format.
12. Add state snapshots per round.
13. Add event normalization.
14. Add action-specific descriptions.
15. Add highlight detection.
16. Add highlight scoring.
17. Add dramatic score.
18. Add close-finish detection.
19. Add comeback arc detection.
20. Add sabotage swing detection.
21. Add clutch roll detection.
22. Add tension curve labels.
23. Add beat extraction.
24. Add replay titles.
25. Add replay subtitles.
26. Add summary copy.
27. Add share URL builder.
28. Add compact replay payload encoding.
29. Add replay parser.
30. Add replay route alias.
31. Add replay viewer component.
32. Add replay timeline component.
33. Add replay highlight rail.
34. Add replay player cards.
35. Add replay controls.
36. Add keyboard controls.
37. Add accessible labels for controls.
38. Add auto-advance playback.
39. Add cinematic mode.
40. Add analysis mode.
41. Add replay comparison mode.
42. Add before/after tuning replay generation.
43. Add paired timeline comparison.
44. Add replay ranking from batch.
45. Add top replay table.
46. Add replay filters.
47. Add replay tags.
48. Add replay export JSON.
49. Add replay export Markdown.
50. Add replay export CSV summary.
51. Add replay capture plan.
52. Add screenshot step names.
53. Add deterministic screenshot URLs.
54. Add Playwright replay capture script.
55. Add `npm run replay:capture`.
56. Add capture presets.
57. Add screenshot output folder.
58. Add `.gitignore` rules for large generated captures.
59. Add optional committed small sample captures.
60. Add replay gallery data file.
61. Add replay gallery page.
62. Add gallery cards.
63. Add open-in-simulator links.
64. Add copy-link buttons.
65. Add use-as-marketing-proof metadata.
66. Add Replay Director panel inside simulator.
67. Add direct-this-game button after single simulation.
68. Add find-best-replays-from-batch button.
69. Add build-paired-replay-from-candidate button in Autopilot candidate detail.
70. Add send-to-gallery button.
71. Add localStorage replay library.
72. Add import/export replay library JSON.
73. Add pinned replays.
74. Add replay notes.
75. Add subjective quality fields.
76. Add replay schema version.
77. Add replay validation.
78. Add migration helper for future schemas.
79. Add tests for replay timeline conversion.
80. Add tests for highlight detection.
81. Add tests for dramatic scoring.
82. Add tests for share URL encode/decode.
83. Add tests for export formats.
84. Add tests for capture plan generation.
85. Add tests for paired replay comparison.
86. Add CLI script.
87. Add package scripts.
88. Add CLI commands.
89. Add CLI JSON output.
90. Add CLI Markdown output.
91. Add CLI gallery output.
92. Add CLI capture-plan output.
93. Add CLI paired replay output.
94. Add docs page.
95. Add examples to docs.
96. Add interpretation guide.
97. Add known limitations.
98. Add CI smoke test.
99. Add no-network capture mode.
100. Add screenshot verification.
101. Add visual route health check.
102. Add mobile viewport capture verification.
103. Add social viewport capture verification.
104. Add replay markdown report artifact.
105. Add latest replay gallery doc snapshot.
106. Add marketing site integration.
107. Add homepage proof strip.
108. Add press page replay embeds.
109. Add social card metadata.
110. Add Open Graph image generation from replay screenshot.
111. Add replay thumbnail selection.
112. Add thumbnail frame scoring.
113. Add best-frame detector.
114. Add animated GIF or short video export later if tooling allows.
115. Add compression rules for generated media.
116. Add replay anonymization.
117. Add production-safe replay payload limits.
118. Add replay payload fallback.
119. Add replay analytics hooks later.
120. Add live-game replay capture later.
121. Add simulator-vs-live replay comparison later.
122. Add official curated replay workflow.
123. Add replay changelog.
124. Add recurring replay report.
125. Add Replay Director score to Balance Autopilot reports.
