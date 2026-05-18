# Game UI Readability Standard

Generated: 2026-05-18

## Active Play Rule

The active play screen must keep the vault/action area visually dominant. Persistent UI exists to answer immediate gameplay questions, not to expose every available system.

## Active Play Information Budget

Persistent active-play UI may show:

- operation id
- round
- player count
- pressure/timer state
- current table state
- vault progress
- compact opponent threat chips
- current action controls
- latest important event
- transaction state only when a transaction is active

Everything else belongs in a drawer, tab, post-action surface, replay screen, or dedicated workbench route.

## Secondary Information

Secondary information includes:

- full event log
- debug trace
- session integration rail
- command strip
- full player dossiers
- full replay timeline
- round summary archive
- exact contract/readiness traces
- dense probability or rule explanations

Secondary information must not be persistently visible during active play unless it blocks the user from taking the next required action.

## Screenshot Review Checklist

1. The vault/action stage is the largest and clearest region.
2. The current action controls are obvious.
3. No corner is crowded with unrelated badges, buttons, meters, or logs.
4. Opponent status is compact and scannable.
5. Full logs/details are accessible but closed by default.
6. The screen has calm negative space around the game object.
7. Mobile layout shows status, stage, action, and details toggle before dense archives.
8. No overlapping text or controls.
9. No horizontal overflow.
10. The persistent UI answers only immediate gameplay questions.

## Workbench Exception

Simulator, Ghosts, Mutations, Playtest, Design, Ops, and Launch pages may be denser because they are workbenches. They still need hierarchy, tabs/drawers for raw data, and a clear primary work area.
