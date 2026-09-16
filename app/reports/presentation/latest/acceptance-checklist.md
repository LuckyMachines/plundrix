# Premium presentation acceptance checklist

Date: 2026-09-13

## Automated acceptance

- [x] One machine-readable contract defines five phases, three action identities, timing, audiovisual cues, DOM budgets, and accessibility guarantees.
- [x] Instant Play and Vault Run use the same seal, reveal, impact, recovery, and planning sequence.
- [x] Live on-chain resolution uses the shared cue language and premium resolution treatment.
- [x] Controls remain disabled until consequences land and recovery begins.
- [x] Pick, Search, and Sabotage have distinct tools, colors, intent sounds, success sounds, and failure sounds.
- [x] Sound preference, master volume, gesture unlock, haptics preference, and reduced-motion behavior remain intact.
- [x] The Nightfall Vault reacts to route, outcome, leader, pressure, damage, and lock progress.
- [x] Desktop, laptop, and mobile premium-impact captures pass visual, layout, typography, asset, and accessibility checks.
- [x] All 15 improvement checks and the production build pass.

## Reference review

- [x] Composition retains the reference's central vault/workbench hierarchy while giving the moment a clearer action focal point.
- [x] The action tool, concentric impact rings, title, target, and gadget badge form distinct near, middle, and far visual layers.
- [x] The cool industrial palette and sparse warm metal accents remain coherent with the source art.
- [x] Relative-depth evidence confirms a readable foreground overlay, mid-depth vault, and recessed room.
- [x] Perspective evidence from the unchanged canonical world remains valid; the theater is a screen-space layer and does not alter scene geometry.

Evidence:

- `reference-vs-premium-impact.png`
- `depth/reference-vs-actual-depth.png`
- `../../ui-review/latest/actual/premium-theater-desktop.png`
- `../../ui-review/latest/actual/premium-theater-laptop.png`
- `../../ui-review/latest/actual/premium-theater-mobile.png`

## Human evidence still required

- [ ] Four first-time players identify the chosen action, success or failure, and affected rival within three seconds.
- [ ] Players describe Pick, Search, and Sabotage as distinct from sound alone without sound carrying required information.
- [ ] Perceived impact and replay desire improve without slowing the first meaningful action.
- [x] Recorded CC0 foley replaces procedural cues in production; the runtime caps voices, suppresses repeats, and ducks music under important outcomes.

The implementation is intentionally maintainable by one person: data defines identity and timing, one director emits cues, one theater renders the moment, and deterministic browser fixtures protect every canonical viewport.
