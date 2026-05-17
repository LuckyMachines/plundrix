# Self-Teaching Playtest Coach Implementation Plan

1. Define the superpower as a system that converts simulator, Ghosts, mutation, replay, Oracle, and launch signals into concrete human playtest missions.
2. Create `app/src/lib/playtestCoach.js`.
3. Define `PLAYTEST_COACH_SCHEMA_VERSION = 1`.
4. Define storage keys for missions, sessions, feedback, reports, and pinned missions.
5. Define playtest mission source types: simulator smoke, replay proof, ghost report, mutation report, Oracle recommendation, launch gate blocker, and manual design question.
6. Define categories: onboarding, balance, replay drama, archetype feel, sabotage fatigue, tool economy, pacing, contract risk, launch readiness, and accessibility.
7. Define difficulty levels: 5-minute check, 15-minute playtest, 30-minute session, focused group, and launch rehearsal.
8. Define tester roles: new player, reckless picker, tool hoarder, revenge saboteur, leader hunter, comeback hunter, closer, observer, facilitator, and wallet setup tester.
9. Define observation dimensions and feedback scales.
10. Add mission templates for onboarding, sabotage fatigue, tool hoarder viability, comeback readability, closer dominance, mutation A/B, replay memory, launch rehearsal, wallet setup friction, and accessibility scan.
11. For each template define setup, script, tasks, expected observations, pass criteria, fail criteria, questions, captured data, and follow-up.
12. Add `buildPlaytestMission`.
13. Add `selectMissionTemplate`.
14. Add artifact hydration for seeds, scenarios, rule diffs, ghost archetypes, replay links, risks, recommendations, regressions, and target observations.
15. Add deterministic role assignment.
16. Add facilitator script generation.
17. Add tester brief generation.
18. Add observation sheet generation.
19. Add pass/fail rubric generation.
20. Add playtest feedback scoring.
21. Add session summary generation.
22. Add playtest report generation.
23. Add playtest backlog generation from Oracle, Ghosts, Mutation, Launch, and Replay inputs.
24. Rank backlog by impact, urgency, confidence gap, effort, launch relevance, and severity.
25. Add Markdown, JSON, and CSV exports.
26. Add validation and migration helpers.
27. Add browser storage helpers for missions, sessions, feedback, reports, pinned missions, and imports/exports.
28. Add `app/scripts/playtest-coach.mjs`.
29. Add package scripts: `playtest:coach`, `playtest:backlog`, and `test:playtest`.
30. Add CLI flags for source, category, question, duration, testers, seed, scenario, ghost scenario, mutation preset, json, markdown, csv, and out.
31. Keep CLI lightweight and artifact-driven by default.
32. Add `app/scripts/test-playtest-coach.mjs`.
33. Test template selection, hydration, role assignment, scripts, briefs, observation sheets, rubrics, feedback scoring, summaries, reports, backlog ranking, exports, validation, storage-safe helpers, and no secret leakage.
34. Add simulator handoff helpers for scenario/rules missions.
35. Add replay memory mission helpers.
36. Add ghost archetype mission helpers.
37. Add mutation human-validation mission helpers.
38. Add Balance Autopilot candidate playtest mission helpers.
39. Integrate with Live Ops Oracle by adding top human validation mission, backlog, last outcome placeholder, and recommendations.
40. Integrate with Launch Copilot by adding playtest mission proof and launch rehearsal proof.
41. Add `app/src/pages/PlaytestPage.jsx`.
42. Add route `/playtest`.
43. Add nav item `Playtest`.
44. Dashboard shows mission generator, source/category controls, tester count, duration, mission, facilitator script, tester briefs, observation sheet, feedback form, session summary, backlog, saved reports, and exports.
45. Add one-click missions for onboarding, sabotage fatigue, Tool Hoarder, mutation, replay memory, and launch rehearsal.
46. Add docs `docs/dev/playtest-coach.mdx`.
47. Add latest report `docs/playtest-coach-latest.md`.
48. Update docs index.
49. Add `.gitignore` entries for playtest reports.
50. Update CI smoke with `npm run test:playtest` and `npm run playtest:coach -- --markdown`.
51. Generate first mission and latest snapshot.
52. Run tests.
53. Run CLI smoke.
54. Run build.
55. Check `/playtest` route.
56. Check no placeholder markers.
57. Confirm no deep simulations or media capture run by default.
58. Confirm it can operate from existing artifacts and safe defaults without network.
59. Final outcome: Plundrix can translate machine signals into human playtest missions, score feedback, and loop results back into simulator, Ghosts, Mutation, Oracle, and Launch systems.
