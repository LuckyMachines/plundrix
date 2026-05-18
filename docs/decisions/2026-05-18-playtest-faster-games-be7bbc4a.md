# Playtest Faster games

Decision ID: design-decision-be7bbc4a
Created: 2026-05-18T04:19:25.721Z
Status: accept
Operator: Codex
Hypothesis: design-hypothesis-330cf99b

## Decision

Accept faster-games playtest as a focused validation path, not as a shipping decision by itself.

## Evidence Used

- replay-director: Player 1's comeback run scored 100.0 drama.
- live-ops-oracle: Rule Mutation Time Machine found a higher-scoring candidate under smoke comparison.
- launch-copilot: Launch readiness 80/100 with 1 blockers.
- playtest-coach: Human playtest result pass: Accept the onboarding finding and continue validation.
- ghosts: Ghost score 69/100, healthiest Tool Hoarder, riskiest Reckless Picker.

## Accepted Risks

- Mutation score can look promising while hurting role health.

## Rejected Alternatives

- Let seed-specific backlog churn hide the decision
- Ship without playtest confirmation

## Follow-Up Validation

- Run imported human playtest
- Re-run Tower with decisions loaded
- Re-run launch packet

## Next Command

record decision
