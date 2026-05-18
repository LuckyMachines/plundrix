# Game UI Negative Space Implementation Plan

Generated: 2026-05-18

This plan turns the Plundrix game UI negative-space and readability standard into an implementation sequence. The purpose is to protect active gameplay readability: the game object, current action, silhouettes, and immediate decision should always be clearer than secondary panels, logs, badges, meters, decorative chrome, or debug/status data.

## Standard

Do not cram the game UI full of icons, panels, meters, labels, numbers, banners, and buttons. Negative space is gameplay readability space. Preserve the main gameplay/toy/display area as the visual priority. Use only information needed at the current moment, push secondary information into menus, drawers, tabs, hover/tap details, or post-action screens, and keep the persistent HUD minimal.

## Sequential Implementation List

1. Audit every game-facing route: `/game/:gameId`, `/simulator`, `/replays`, `/replay/:replayId`, `/ghosts`, `/mutations`, `/playtest`, `/design`, `/ops`, and `/launch`.
2. Separate routes into active play surfaces and workbench surfaces.
3. Define the active play priority stack: game object, current action choices, critical turn state, opponent threat state, transaction feedback, everything else.
4. Define the persistent HUD budget: one primary status region, one action region, one compact player/opponent summary region, one collapsible details region, no duplicate always-visible status panels.
5. Add this written UI standard doc.
6. Create a game UI inventory for every `GamePage` component.
7. Audit `GamePage` layout for top-level panels, repeated status, and elements competing with the vault/action area.
8. Make the vault/action area the layout anchor.
9. Reduce persistent panels on `GamePage`.
10. Create a compact match-status strip.
11. Replace multiple status cards with the status strip where possible.
12. Create a collapsible Table Details drawer for full player stats, event log, contract/debug details, session history, and less urgent integration info.
13. Default the Table Details drawer closed during active play.
14. Keep drawer state user-controlled.
15. Create moment panels for action selection, waiting, resolution, and game over.
16. Ensure each moment shows only information needed for that state.
17. During action selection, show action controls prominently and only target/player info needed for the selected action.
18. During waiting, show calm confirmation state and who/what remains pending.
19. During resolution, emphasize outcome and suppress nonessential panels.
20. During game over, allow richer summary info.
21. Audit icon usage and remove decorative icons that do not aid recognition.
22. Audit labels and remove redundant labels.
23. Audit badges and keep only decision-critical badges during active play.
24. Audit meters and keep only current-action meters.
25. Audit numbers and keep only numbers needed to act.
26. Define critical active-play information.
27. Define secondary information.
28. Move secondary information out of persistent play layout.
29. Add a reusable `GameShell` layout.
30. Refactor `GamePage` into `GameShell`.
31. Give the main stage stable responsive dimensions.
32. Create a dedicated `VaultStage` composition.
33. Move non-stage controls outside `VaultStage`.
34. Create an `ActionDock`.
35. Collapse detailed action explanations.
36. Make target selection contextual.
37. Make tool details contextual.
38. Reduce player dossiers.
39. Design opponent chips around silhouette readability.
40. Avoid full stat cards for every opponent in active play.
41. Create a calm empty/waiting state.
42. Create focused transaction state.
43. Move transaction logs/debug traces to details.
44. Reduce event log persistence.
45. Add event importance levels.
46. Only show critical/important events in active play.
47. Make background events accessible in the drawer.
48. Add a quiet mode layout option.
49. Respect accessibility settings.
50. Ensure negative space survives high contrast mode.
51. Audit mobile first.
52. On mobile prioritize status strip, vault stage, action dock, drawer button.
53. Move secondary panels below the fold or into drawers on mobile.
54. Avoid sticky elements stacking on mobile.
55. Use one sticky action dock at most.
56. Audit desktop.
57. Use wide desktop space for breathing room, not more widgets.
58. Add max-widths to dense text regions.
59. Add minimum spacing between gameplay clusters.
60. Standardize panel visual weight.
61. Remove nested cards inside gameplay surfaces.
62. Remove decorative borders that do not separate functional regions.
63. Reduce uppercase tracking in dense labels where readability suffers.
64. Ensure button text never wraps awkwardly.
65. Use icons only when they reduce cognitive load.
66. Add hover/tap affordances for hidden detail.
67. Avoid hiding required decisions behind hover-only UI.
68. Define route-specific standards for `/simulator`.
69. Reduce simulator control density.
70. Define route-specific standards for `/replay/:replayId`.
71. Keep replay viewer cinematic.
72. Define route-specific standards for `/replays`.
73. Define route-specific standards for `/ghosts`.
74. Define route-specific standards for `/mutations`.
75. Define route-specific standards for `/playtest`, `/design`, `/ops`, and `/launch`.
76. Add visual regression screenshots.
77. Add screenshot dummy data fixtures.
78. Add a screenshot command.
79. Add a readability checklist for screenshot review.
80. Add automated layout assertions where feasible.
81. Add CSS utilities for gameplay layouts.
82. Replace ad hoc spacing with those utilities.
83. Add a design token for gameplay chrome intensity.
84. Reduce chrome intensity around the main stage.
85. Increase contrast only for action-critical controls.
86. Add state-based information rules.
87. Remove always-on instructional text from active play.
88. Move instructions into Field Manual or contextual help.
89. Ensure new players still understand with one compact hint at a time.
90. Make hints dismissible.
91. Store dismissed hint state locally.
92. Avoid hint overlays that cover the vault.
93. Add progressive disclosure for probabilities.
94. Add progressive disclosure for player stats.
95. Add progressive disclosure for logs.
96. Add progressive disclosure for contract info.
97. Review all game component props.
98. Refactor repeated status components.
99. Remove duplicate phase indicators.
100. Remove duplicate pending-action indicators.
101. Remove duplicate wallet/contract notices inside active play unless blocking.
102. Keep global network banner from stacking awkwardly with game status.
103. Add route-level body class or layout mode.
104. Use layout mode to tune spacing and chrome.
105. Add acceptance criteria to project docs.
106. Add negative-space review to future UI checklist.
107. Add route screenshot links to release readiness docs.
108. Update Launch Copilot route checks where practical.
109. Update Design Tower with a UI readability hypothesis.
110. Create evidence records for the redesign.
111. Implement `GameShell`.
112. Implement `StatusStrip`.
113. Implement `ActionDock`.
114. Implement `DetailsDrawer`.
115. Implement compact opponent chips.
116. Implement contextual target selector.
117. Implement latest-event-only surface.
118. Implement post-action result focus.
119. Implement quiet waiting state.
120. Implement game-over summary mode.
121. Refactor `GamePage` to use the new system.
122. Refactor `ReplayPage` to preserve a large replay stage.
123. Refactor `SimulatorPage` advanced controls into tabs/drawers.
124. Refactor `GhostsPage` into clearer tabs if currently too dense.
125. Refactor `MutationsPage` advanced/raw outputs into expandable regions.
126. Add CSS/token cleanup.
127. Add screenshot fixtures.
128. Add screenshot command.
129. Run screenshot capture.
130. Review screenshots manually.
131. Fix overlap/crowding found in screenshots.
132. Run mobile screenshot review.
133. Fix mobile-specific cramped areas.
134. Run `npm run build`.
135. Run relevant tests.
136. Run placeholder scan.
137. Update docs with completed implementation notes.
138. Commit the full redesign.
139. Push to remote.
140. Keep future game UI changes subject to this standard.

## Initial Implementation Scope

The first implementation pass focuses on active play readability: `GamePage`, shared gameplay layout primitives, persistent HUD reduction, collapsible details, route-level SEO-neutral UI docs, and build verification. Workbench routes can remain denser, but any future edits to them should follow this standard.
