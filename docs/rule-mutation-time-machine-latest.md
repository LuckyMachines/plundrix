# Plundrix Rule Mutation Time Machine

Generated: 2026-05-15

Rule Mutation Time Machine is the causal comparison layer for Plundrix rules. It compares baseline and candidate rules with the same seed, simulator, replay system, and ghost cast.

## Default Smoke Command

```bash
npm run mutate:rules -- --budget smoke --markdown
```

## Matrix Command

```bash
npm run mutate:matrix -- --budget smoke --csv
```

## Latest Smoke Snapshot

- Default preset: faster-games
- Budget: smoke
- Comparison scope: simulator, replay, ghost cast, contract impact, rollback patch
- Deep runs: opt-in only
- Media capture: not triggered by default

## Outputs

- Markdown mutation report
- JSON mutation report
- rule diff CSV
- mutation matrix CSV
- rollback patch JSON
- Oracle mutation snapshot
- Launch Copilot mutation proof

## Verification

```bash
npm run test:mutations
npm run mutate:rules -- --budget smoke --markdown
```
