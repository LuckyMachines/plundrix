# Product Cohesion Implementation Plan

Generated: 2026-05-18

This plan turns Plundrix cohesion into an implementation track. The purpose is to make every route, proof artifact, command, risk, saved report, SEO page, and game surface feel like one product instead of a collection of disconnected tools.

## Product Spine

Plundrix is a short-session onchain vault-heist strategy game built around Pick, Search, Sabotage, and replayable table drama.

## Canonical Terms

- Operation: a game instance.
- Round: one action cycle.
- Vault: the shared objective.
- Operator: a player.
- Proof: saved evidence artifact.
- Gate: launch/readiness checkpoint.
- Evidence: simulator, replay, ghost, mutation, playtest, telemetry, or launch output.

## Product Loop

Play -> Simulate -> Replay -> Ghosts -> Mutate -> Playtest -> Decide -> Launch -> Observe

## Sequential Implementation List

1. Save this cohesion implementation plan to `docs/product-cohesion-implementation-plan.md`.
2. Add a canonical product statement.
3. Add canonical product terms.
4. Add route purpose definitions.
5. Add route class definitions.
6. Define the product loop.
7. Add a shared `productSpine` data module containing statement, routes, route classes, loop steps, terms, evidence types, and CTA verbs.
8. Refactor existing hardcoded route labels to use `productSpine`.
9. Add a reusable `PageIntro` component.
10. Refactor `/simulator` to use `PageIntro`.
11. Refactor `/replays` to use `PageIntro`.
12. Refactor `/replay/:replayId` to use `PageIntro` only where it does not interfere with replay focus.
13. Refactor `/ghosts` to use `PageIntro`.
14. Refactor `/mutations` to use `PageIntro`.
15. Refactor `/playtest` to use `PageIntro`.
16. Refactor `/design` to use `PageIntro`.
17. Refactor `/ops` to use `PageIntro`.
18. Refactor `/launch` to use `PageIntro`.
19. Refactor `/compare` to use `PageIntro`.
20. Add a reusable `ProductLoopRail` component.
21. Add `ProductLoopRail` to workbench pages.
22. Keep `ProductLoopRail` off active play unless collapsed in details.
23. Add a reusable `ProofCard` component.
24. Refactor simulator report output cards to `ProofCard`.
25. Refactor replay proof cards to `ProofCard`.
26. Refactor ghost report cards to `ProofCard`.
27. Refactor mutation report cards to `ProofCard`.
28. Refactor playtest report cards to `ProofCard`.
29. Refactor design evidence cards to `ProofCard`.
30. Refactor launch proof cards to `ProofCard`.
31. Add a reusable `RiskCard` component.
32. Refactor Oracle risk cards to `RiskCard`.
33. Refactor Launch risk cards to `RiskCard`.
34. Refactor Design Tower risk/conflict displays to `RiskCard`.
35. Refactor Playtest failure/blocker displays to `RiskCard`.
36. Refactor Mutation regression displays to `RiskCard`.
37. Refactor Ghost risk displays to `RiskCard`.
38. Add a reusable `CommandCard` component.
39. Refactor Launch command list to `CommandCard`.
40. Refactor Oracle command recommendations to `CommandCard`.
41. Refactor Design Tower missing-decision commands to `CommandCard`.
42. Refactor Playtest next-test command to `CommandCard`.
43. Refactor Mutation next-command displays to `CommandCard`.
44. Refactor Ghost recommendation commands to `CommandCard`.
45. Add standardized empty state component.
46. Refactor empty state in `/sessions`.
47. Refactor empty state in `/leaderboard`.
48. Refactor empty state in `/replays`.
49. Refactor empty state in `/ghosts`.
50. Refactor empty state in `/playtest`.
51. Refactor empty state in `/design`.
52. Refactor empty state in `/ops`.
53. Refactor empty state in `/launch`.
54. Add standardized saved report card component.
55. Refactor saved reports in Replays.
56. Refactor saved reports in Ghosts.
57. Refactor saved reports in Mutations.
58. Refactor saved reports in Playtest.
59. Refactor saved reports in Design.
60. Refactor saved snapshots in Ops.
61. Add a `GlossaryLink` component.
62. Use glossary links in docs/workbench copy where helpful.
63. Add a global glossary route or section.
64. Add `/glossary` route.
65. Add glossary to footer.
66. Add glossary to docs/readability/cohesion docs.
67. Add page-level SEO metadata for all major routes.
68. Add route metadata to `productSpine`.
69. Refactor `Seo` usage to pull route metadata.
70. Add canonical and descriptions for workbench routes.
71. Add schema only where useful.
72. Update sitemap to include `/glossary`.
73. Ensure postbuild SEO shells include all major static routes.
74. Add a shared `CohesionLayout` for workbench pages.
75. Refactor workbench pages gradually to `CohesionLayout`.
76. Keep active game UI on `GameShell`, not `CohesionLayout`.
77. Add a “Latest Evidence” component.
78. Add Latest Evidence to `/ops`.
79. Add Latest Evidence summary to `/design`.
80. Add Latest Evidence compact version to `/launch`.
81. Add a product map section.
82. Add `/map` route or add map into `/ops`.
83. Implement `/map` as a public product map.
84. Add `/map` to footer.
85. Add `/map` to nav only if it does not crowd nav.
86. Add unified CTA verbs to `productSpine`.
87. Audit button labels against CTA verbs.
88. Rename inconsistent CTAs.
89. Audit `game`, `session`, `match`, and `operation` usage.
90. Replace inconsistent player-facing usage with canonical terms.
91. Keep developer-only docs technical where needed, but add term notes.
92. Audit player/operator usage.
93. Audit report/proof/evidence usage.
94. Add comments or helper names that encode these distinctions.
95. Create one canonical sample operation seed.
96. Add canonical sample data file.
97. Use canonical sample in screenshots.
98. Use canonical sample in docs.
99. Use canonical sample in generated examples where practical.
100. Update screenshot fixtures to use canonical sample.
101. Add cohesion screenshot targets.
102. Add screenshot review checklist.
103. Add automated static text scan.
104. Add exceptions list for legal/dev docs.
105. Add a `npm run cohesion:check` script.
106. Make `cohesion:check` verify product spine route coverage, sitemap route coverage, metadata, placeholder terms, and marker cleanliness.
107. Add tests for product spine.
108. Add tests for comparison pages using product spine terms.
109. Add tests for postbuild SEO routes.
110. Add tests for shared components where feasible.
111. Update Launch Copilot route file checks.
112. Update Design Tower to include a cohesion hypothesis.
113. Add a design decision record after first cohesion implementation.
114. Add documentation for adding new pages without breaking cohesion.
115. Add instructions: choose route class, add route metadata, add PageIntro, connect to loop, use shared cards, add sitemap/postbuild shell if public.
116. Refactor `Header` nav labels to route metadata where practical.
117. Refactor `Footer` links to route metadata where practical.
118. Keep nav grouped as Play, Lab, Ship, Reference.
119. Add Map/Glossary to Reference.
120. Avoid crowding nav with too many public SEO pages.
121. Add related-route links at the bottom of each workbench.
122. Add route-level next-step data to productSpine.
123. Render next step through CohesionLayout.
124. Add unified visual treatment for route category.
125. Use category subtly in PageIntro eyebrow.
126. Do not add heavy decorative category chrome.
127. Audit typography.
128. Audit panel nesting.
129. Audit color usage.
130. Add color role documentation.
131. Refactor obvious color misuse.
132. Audit border radius and panel treatment.
133. Normalize cards to 6-8px radius.
134. Normalize section spacing.
135. Normalize table styles.
136. Normalize copy buttons.
137. Normalize export buttons.
138. Normalize saved artifact lists.
139. Normalize command lists.
140. Normalize risk lists.
141. Normalize proof lists.
142. Add a shared `ArtifactActions` component.
143. Refactor repeated export controls to `ArtifactActions`.
144. Add shared timestamp formatting.
145. Refactor artifact timestamps.
146. Add shared status/grade badge component.
147. Refactor grades across Autopilot, Ghosts, Mutations, Oracle, Launch, Design.
148. Add a shared `EvidenceTypeBadge`.
149. Refactor synthetic/facilitated/live evidence badges.
150. Ensure active game UI remains separate and uncluttered.
151. Run `npm run cohesion:check`.
152. Run focused component tests.
153. Run `npm run build`.
154. Inspect generated static shells.
155. Run placeholder scan.
156. Run screenshot capture if available.
157. Manually review route screenshots.
158. Fix route-level cohesion issues found in review.
159. Update cohesion plan statuses.
160. Commit and push.

## Initial Implementation Scope

The first implementation pass should complete the product spine, shared route intro/loop/proof/risk/command/empty/report components, public glossary, public product map, route metadata, static SEO shell coverage, cohesion check script, and central page adoption. Large visual refactors of every table and artifact list can continue in later passes, but all new code should use the shared cohesion primitives.

## Initial Pass Completed

Implemented in the first pass:

- Product spine data module.
- Shared PageIntro, ProductLoopRail, CohesionLayout, ProofCard, RiskCard, CommandCard, EmptyState, SavedReportCard, GlossaryLink, StatusBadge, and LatestEvidence components.
- Public `/map` product map route.
- Public `/glossary` route.
- Route metadata for static and dynamic app routes.
- Product-spine-driven postbuild SEO shells.
- Expanded sitemap coverage.
- Header/footer references for Map and Glossary.
- Central workbench adoption on Replays, Ghosts, Mutations, Playtest, Design, Ops, Launch, and Compare.
- `npm run cohesion:check`.

## Page Addition Checklist

1. Choose a route class: Game UI, Workbench UI, Marketing/SEO UI, Legal/support UI, or Reference UI.
2. Add the route and metadata to `app/src/data/productSpine.js`.
3. Pick the product loop step the page supports.
4. Use `PageIntro` or `CohesionLayout` unless the page is active gameplay.
5. Use shared proof, risk, command, empty-state, and saved-report components for new artifacts.
6. Add the public route to sitemap/static shell generation through product spine metadata.
7. Run `npm run cohesion:check`.
8. Run `npm run build`.
