# Plundrix Internal Playtest Protocol

## Purpose

Run repeatable human sessions that test whether Plundrix is understandable, tense, fair, and memorable before design or launch decisions harden.

## Session Setup

- Use a fresh browser profile or a clean local session.
- Use the current internal-playtest build unless the test explicitly names a candidate ruleset.
- Do not explain optimal strategy before the first match.
- Assign one facilitator and one observer when possible.
- Capture only anonymized tester ids such as `tester-01`; do not record real names.

## Required Missions

1. First Match Onboarding
   - Verify goal comprehension, action comprehension, agency, and remembered moment.
2. Tool Hoarder Viability
   - Verify whether a search-heavy strategy feels clever, fair, and counterable.
3. Mutation A/B Playtest
   - Compare baseline rules to one candidate without revealing the rule diff first.
4. Replay Memory Check
   - Verify whether a replay can be retold and shared after one viewing.

## Facilitator Rules

- Intervene only when the tester is blocked by setup, wallet, routing, or rules comprehension.
- Mark the exact step before helping.
- Ask the tester to narrate intent before each action.
- Do not correct strategy choices during the match.
- Ask debrief questions before revealing the tested hypothesis.

## Observation Rubric

Rate each dimension from 1 to 5:

- Comprehension: can explain the goal and action meanings.
- Agency: feels their choice changes the result.
- Tension: feels the vault race has stakes.
- Fairness: understands why outcomes happened.
- Frustration: lower is better; repeated helplessness is a failure signal.
- Replayability: wants another round.
- Setup friction: lower is better; wallet, route, or rules blockers count here.

## Required Notes

- Actions taken.
- Confusion moments.
- Fun or memorable moments.
- Frustration moments.
- Would replay.
- Would share replay.
- Observer notes.

## Import

Save anonymized results as JSON matching `app/data/playtests/schema.json`, then run:

```bash
npm run playtest:import -- --file data/playtests/sample-session.json --markdown
```

Imported reports are written to `app/reports/playtest/imported/` and can be attached to Design Tower evidence.
