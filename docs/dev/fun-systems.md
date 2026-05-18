# Fun Systems

Plundrix treats fun as a measurable layer shared by the live game, simulator, replay director, and balance tools.

## Core Language

- Action identities: pick is pressure, search is preparation, sabotage is drama, idle is anticipation, committed is locked-in intent.
- Table moods: calm, building, urgent, final lock, chaos, cooldown, and victory.
- Operator reactions: waiting, focused, armed, marked, stunned, committed, threatening, and finished.
- Vault reactions: listening, resisting, cracking, angry, almost open, and breached.
- Moment tags: near miss, comeback spark, shutdown, robbery, final lock, tool spike, clean breach, dead air, commitment, and vault crack.

## Shared Module

The shared implementation lives in `app/src/lib/funSystems.js`. It exports deterministic helpers for UI state, simulator telemetry, replay metadata, and proof scoring.

The helpers accept both simulator events and live chain events. Simulator events usually use `type`; live events usually use `name` and `args`.

## Commands

- `npm run test:fun` verifies deterministic fun derivation.
- `npm run fun:check` runs a lightweight smoke sample across first-match, comeback, stall, and aggressive scenarios.
- `npm run fun:check -- --json` emits machine-readable proof.
- `npm run fun:check -- --report` writes `reports/fun-check-latest.md`.

## Scoring

Fun proof scores five dimensions:

- Agency: choices produce meaningful outcomes.
- Drama: matches create memorable swings.
- Readability: outcomes are legible and paced.
- Rhythm: games avoid flat, stalled, or rushed arcs.
- Variety: pick, search, and sabotage all matter.

The aggregate fun score is included in simulation summaries, batch scorecards, replay metadata, and balance promotion evidence.
