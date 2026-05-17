# Self-Teaching Playtest Coach Latest

Generated: 2026-05-15

## Summary

The Playtest Coach is now wired as a repeatable human validation layer for Plundrix. It turns simulator, replay, ghost, mutation, Oracle, and launch signals into missions with scripts, tester briefs, observation sheets, scored sessions, reports, exports, storage, and a prioritized backlog.

## Current Mission Shape

- Source types: manual design question, simulator smoke, replay proof, ghost report, mutation report, Oracle recommendation, launch gate blocker.
- Categories: onboarding, balance, replay drama, archetype feel, sabotage fatigue, tool economy, pacing, contract risk, launch readiness, accessibility.
- Default output: facilitator script, tester briefs, observation sheet, pass/fail rubric, recommended machine runs.
- Human outcome states: pass, fail, needs follow-up, inconclusive.

## Commands

```bash
npm run playtest:coach -- --markdown
npm run playtest:coach -- --source mutation-report --report --markdown
npm run playtest:backlog
npm run test:playtest
```

## Integrated Surfaces

- `/playtest` dashboard for mission generation, scoring, exports, saved reports, and backlog review.
- Live Ops Oracle health, risks, opportunities, and recommendations.
- Launch Copilot gates, proof bundle, route checks, command plan, fixtures, and launch rehearsal.
- CI smoke workflow with the Playtest Coach test and mission export.

## Current Recommendation

Run the default onboarding mission first, then run one mutation A/B playtest and one launch rehearsal before promoting any gameplay or launch gate change.
