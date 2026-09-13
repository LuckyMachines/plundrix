# Plundrix 3D World Implementation Checklist

## 1. Establish one source of spatial truth

- [x] Add a machine-readable world manifest with gameplay truths, camera, planes, materials, states and budgets.
- [x] Add a procedural Blender source builder using the same canonical state names.
- [x] Build and inspect the canonical `.blend` and five state renders.

## 2. Connect the world to gameplay

- [x] Derive world phase, route, progress and affected rival from live match state.
- [x] Add modular architecture, station, mechanism, floor and workbench planes to the active vault.
- [x] Preserve live HTML controls and text above the decorative world.
- [ ] Verify Pick, Search, Sabotage, reveal, success, failure and breach responses in the browser.

## 3. Make improvement repeatable

- [x] Add deterministic world build, derivative and validation commands.
- [x] Add beauty, depth, normal and object-ID render-pass output.
- [x] Add a five-state contact sheet and 240 px readability artifact.
- [x] Add automated manifest and integration contract tests.
- [x] Add the world checks to the existing release improvement gate.

## 4. Verify quality

- [x] Pass the world unit contract.
- [x] Pass the world render validator.
- [x] Pass the production build.
- [x] Capture desktop, laptop and mobile active-play references.
- [x] Inspect the world contact sheet and active-play comparisons at original resolution.
- [x] Approve intentional visual baseline changes with a written reason.

## 5. Human evidence

- [ ] Ask four first-time players what changed after a reveal without coaching.
- [ ] Reach at least 80 percent cause comprehension.
- [ ] Record whether the world increases replay intent without slowing the first action.
