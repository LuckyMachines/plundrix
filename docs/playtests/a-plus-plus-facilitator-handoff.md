# A++++ Newcomer Playtest Handoff

Date: 2026-09-16
Experiment: first-operation comprehension
Target: four first-time players, observed individually, without coaching

## Setup

1. Open `/play?experiment=first-operation-comprehension&variant=shared-command-sheet` in a fresh browser profile.
2. Say only: "Please play one complete operation and narrate what you think is happening."
3. Do not explain Pick, Search, Sabotage, rival tells, or the goal unless the player cannot continue. Record any intervention.

## Observe

- Time from the ready screen to the first committed action; target: under 60 seconds.
- Whether the player can state the goal before round two.
- Whether the player can explain why their first result happened.
- Whether they notice and use at least one rival tell.
- Whether they choose rematch, the recommended next objective, another destination, or stop.
- One exact delight moment and one exact confusion moment, if either occurs.

## Record

Use `/playtest`, choose `First Match Onboarding`, check the facilitator-confirmation box only after personally observing the session, and export the JSON. Import from `app/` with:

```bash
npm run playtest:import -- <export-path>
```

Do not turn unobserved assumptions into scores. The experiment passes when at least four confirmed newcomers complete it, 80 percent act within 60 seconds, and 80 percent can explain both the goal and their first result.
