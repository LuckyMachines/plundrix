# Plundrix Player Telemetry Ghosts

Generated: 2026-05-15

Player Telemetry Ghosts are now the living test cast for Plundrix. They convert simulator outcomes into player archetype health, replay story proof, balance risk, Oracle recommendations, and launch readiness evidence.

## Latest Smoke Snapshot

- Scenario: balanced-cast
- Budget: smoke
- Games: 4
- Score: 67/100
- Best story seed: ghost-cli-balanced-cast-1
- Current tuning signal: Closer is overperforming, while Tool Hoarder and Leader Hunter need better paths to affect wins.

## Default Smoke Command

```bash
npm run ghosts:run -- --budget smoke --markdown
```

## Current Archetypes

- Reckless Picker
- Tool Hoarder
- Revenge Saboteur
- Leader Hunter
- Comeback Hunter
- Stall Breaker
- Chaos Agent
- Safe Builder
- Opportunist
- Closer

## Current Scenarios

- balanced-cast
- sabotage-den
- greedy-table
- new-player-ghosts
- comeback-lab
- stall-risk-lab
- high-drama-cast

## Outputs

- Markdown report
- JSON report
- CSV archetype health table
- roster JSON
- replay metadata
- launch proof
- Oracle recommendations
- optional Balance Autopilot ghost validation

## Verification

```bash
npm run test:ghosts
npm run ghosts:run -- --budget smoke --markdown
```
