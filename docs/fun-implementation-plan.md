# Plundrix Fun Implementation Plan

## Superpower

Make every player input, idle state, turn reveal, replay, and simulator result feel like a living heist table with measurable fun proof.

## Sequential Implementation List

1. Define the fun standard: fun is input feel, readable anticipation, expressive response, surprising outcomes, and proof that the system creates stories.
2. Create one shared fun language so UI, simulator, replay, balance, and docs use the same terms.
3. Name the three core action identities: pick is pressure, search is preparation, sabotage is drama.
4. Name the idle state as a first-class play state instead of treating it as visual emptiness.
5. Define table moods that describe the whole match: calm, building, urgent, final lock, chaos, cooldown, and victory.
6. Define operator reactions for each player: waiting, focused, armed, marked, stunned, committed, threatening, and finished.
7. Define vault reactions: listening, resisting, cracking, angry, almost open, and breached.
8. Define moment tags for simulator and replay events: near miss, comeback spark, shutdown, robbery, final lock, tool spike, and clean breach.
9. Add a shared fun systems module that exports action identities, table moods, reactions, moment tags, flavor lines, and telemetry scoring.
10. Keep all fun derivation deterministic so screenshots, replays, and simulator reports are repeatable.
11. Make every helper tolerate both live chain events and simulator events.
12. Add direct unit coverage for action identity derivation.
13. Add direct unit coverage for table mood derivation.
14. Add direct unit coverage for vault reaction derivation.
15. Add direct unit coverage for operator reaction derivation.
16. Add direct unit coverage for moment tags.
17. Add direct unit coverage for deterministic flavor lines.
18. Add direct unit coverage for fun telemetry scoring.
19. Add an `npm run test:fun` command.
20. Add an `npm run fun:check` command.
21. Update the active match status strip so it exposes the current table mood without adding HUD noise.
22. Add mood data attributes to the game shell or stage so CSS can express table state.
23. Add subtle table mood styling that preserves the gameplay area.
24. Add reduced-motion support for all fun animation.
25. Add vault reaction attributes to the vault face.
26. Add visual lock rack responses for listening, resisting, cracking, angry, almost open, and breached.
27. Make the lock rack keep stable dimensions so reaction states do not shift layout.
28. Add action identity attributes to the action panel.
29. Make pick, search, and sabotage each feel physically distinct through button timing, pulse, and pressed state.
30. Keep action controls readable and sparse in line with the negative-space standard.
31. Add operator reaction attributes to opponent chips.
32. Make opponent chips communicate important player states with compact visual hierarchy.
33. Keep opponent chips from becoming a second scoreboard.
34. Add reaction attributes to full player dossiers for details-drawer depth.
35. Add a latest-event moment tag surface.
36. Add a short deterministic flavor line for latest events.
37. Keep latest-event flavor brief so it does not crowd the stage.
38. Use the shared fun module for event labels wherever practical.
39. Add live round anticipation: committed players should feel locked in, open players should feel undecided, and all-in rounds should feel ready to snap.
40. Add a final-lock table mood when any player is one lock away.
41. Add a chaos mood when many high-impact events happen recently.
42. Add an urgent mood when the command layer or pressure model says the round is hot.
43. Add a cooldown mood after a resolve sequence.
44. Add a victory mood after the vault is breached.
45. Add simulator fun telemetry to every single simulation summary.
46. Count action mix in fun telemetry.
47. Count outcome swings in fun telemetry.
48. Count near-win moments in fun telemetry.
49. Count stun moments in fun telemetry.
50. Count comeback and lead-change texture in fun telemetry.
51. Count dead-air risk in fun telemetry.
52. Score agency: do player choices create meaningful outcomes?
53. Score drama: do matches produce turns worth talking about?
54. Score readability: are action outcomes clear and paced?
55. Score rhythm: do matches avoid flat, stalled, or rushed pacing?
56. Score variety: do all core actions show up enough to feel like a game?
57. Compute one aggregate fun score from the dimensions.
58. Add fun score to `summarizeSimulation`.
59. Add fun telemetry to `summarizeSimulation`.
60. Add fun score averages to batch scorecards.
61. Add fun score distribution data to batch scorecards.
62. Add fun guardrails to balance promotion.
63. Keep existing balance gates intact.
64. Make fun guardrails fail only when evidence is present and below bar, so old callers remain compatible.
65. Add fun telemetry to replay objects.
66. Add moment tags to replay objects.
67. Add primary fun tag to replay gallery sorting or metadata.
68. Add fun score to replay marketing proof.
69. Use fun score alongside dramatic score, not as a replacement.
70. Update replay tests for fun fields.
71. Add a CLI fun report that runs a small set of deterministic smoke simulations.
72. Include new-player, comeback, stall, and aggressive-match scenarios in the fun report.
73. Keep fun report default simulation counts low to avoid freezing the machine.
74. Add a `--json` mode for tooling.
75. Add a markdown output mode for human review.
76. Add a report-write mode for repeatable snapshots.
77. Include recommendation lines in the fun report.
78. Include strongest fun proof lines in the fun report.
79. Include weakest fun gaps in the fun report.
80. Add docs explaining the fun system.
81. Document action identities.
82. Document table moods.
83. Document operator reactions.
84. Document vault reactions.
85. Document moment tags.
86. Document fun telemetry.
87. Document commands for testing and checking fun.
88. Update launch or product evidence surfaces so fun proof is visible to the team.
89. Add a compact fun proof card to the product cohesion system.
90. Keep fun proof tied to simulator output, not subjective claims.
91. Add screenshot-stable data attributes for table mood and reactions.
92. Ensure dummy-data screenshot paths can render fun states repeatably.
93. Ensure CSS selectors are semantic and easy to inspect.
94. Avoid adding large new dependencies.
95. Avoid heavy browser automation unless a specific visual verification needs it.
96. Run the focused fun tests first.
97. Run the replay tests.
98. Run the balance autopilot tests.
99. Run the cohesion check.
100. Run the production build.
101. Scan touched files for placeholder markers.
102. Review the diff for accidental clutter.
103. Keep any animation subtle enough to preserve gameplay readability.
104. Keep all UI additions behind existing components.
105. Preserve current routes and APIs.
106. Preserve simulator determinism.
107. Preserve replay schema compatibility by adding fields, not removing old fields.
108. Preserve balance score semantics while adding fun proof.
109. Make failure output actionable.
110. Make fun scoring thresholds explicit.
111. Add helper names that read like product language instead of raw math.
112. Keep constants close to the fun module.
113. Keep tests close to command scripts.
114. Make fun reports readable in terminal.
115. Make fun reports easy to paste into docs.
116. Make fun reports easy to compare between commits.
117. Keep docs in `docs/` and developer docs in `docs/dev/`.
118. Keep generated reports out of source control unless deliberately requested.
119. Run `git status` before committing.
120. Commit the full fun implementation in one coherent commit.
121. Push the commit to the current branch.
122. Leave the repo clean.
123. Record any commands that could not be run.
124. Report the saved plan path.
125. Report the main implementation files.
126. Report verification commands.
127. Report the commit hash.
128. Report whether the branch was pushed.
129. Keep the final summary concise.
130. Use this plan as the baseline for future fun grading loops.
