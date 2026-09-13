# Plundrix 3D World Bible

The canonical world is the Nightfall Vault: a compact physical room that makes the simultaneous Pick, Search, and Sabotage race understandable without requiring a free camera or a heavy real-time renderer.

## Delivery strategy

Plundrix ships a layered 2.5D scene. Blender owns spatial truth, lighting, materials, and reference renders. HTML, CSS, SVG, and React own live game state, controls, readable labels, accessibility, and responsive behavior.

Do not introduce a real-time 3D runtime until a measured interaction requires continuous camera or object movement that layered rendering cannot express. The Blender source remains exportable to glTF if that threshold is reached.

## Product truths

- Four operator positions: one player bench and three unoccupied rival stations.
- Exactly five structural locks.
- Exactly three semantic conduits: Pick blue, Search green, Sabotage red.
- The environment reacts only to real game state.
- Generated or rendered atmosphere never impersonates live gameplay evidence.
- The room contains no baked-in words, controls, currency, people, weapons, or unsupported spectacle.

The machine-readable authority is `app/world/manifest.json`.

## Camera contract

- Perspective projection at 42 mm.
- One-point composition centered at normalized x `0.5`.
- Measured horizon and vanishing point at normalized `(0.5, 0.54158)`.
- Master render size `1280x800`.
- Desktop preserves the full room; mobile favors the central mechanism and crops peripheral architecture before gameplay information.
- Camera changes require new identical-state comparisons and a written baseline-approval reason.

## Depth planes

1. Architecture: rear wall, ceiling, ribs and room shell.
2. Rivals: three physical stations behind the primary mechanism.
3. Mechanism: vault door, five locks and action conduits.
4. Workbench: the player's near-field operating surface.
5. Interface: code-rendered names, odds, targets, status and controls.

Every object must have an obvious contact plane. Floating props, conflicting horizons and scene-local camera guesses fail review.

## Shape and material language

- Concentric vault geometry and five-fold lock structure.
- Chamfered instrument housings and sturdy mechanical joints.
- Blackened steel and vault indigo form the large masses.
- Oxidized brass explains edges, pivots and load-bearing mechanisms.
- Smoked glass, worn enamel and braided cable are accents, not visual noise.
- Pick blue, Search green and Sabotage red are reserved for player-caused signals.
- Breach amber appears only as earned relief.

## Canonical states

| State | World response |
|---|---|
| Preparing | Sealed vault, quiet stations, restrained blue readiness signal. |
| Choose Pick | Pick conduit energizes from the player bench into the mechanism. |
| Simultaneous reveal | All stations and conduits pulse while intentions resolve. |
| Sabotage impact | The affected rival station shorts red without obscuring the vault. |
| Vault breach | Five locks read open and warm light appears behind the displaced door. |

Search uses the same state grammar: its green conduit illuminates the workbench and tool path. Failed outcomes reduce the affected signal rather than inventing unrelated spectacle.

## Asset contract

- Names use `<plane>_<object>_<variant>` in Blender and lowercase kebab-case for exported files.
- Origins sit on the object's support surface or mechanical pivot.
- One Blender unit equals one meter.
- Reusable modules have applied scale, stable normals and no hidden text geometry.
- Architecture, rivals, mechanism and workbench use object indices 1 through 4 for deterministic ID passes.
- Each canonical state exports beauty, relative depth, normal and object-ID passes.
- Shipping derivatives stay under the byte budget in the manifest; source renders and `.blend` remain outside `public/`.

## Quality and performance gates

- The vault remains identifiable at 240 px wide.
- A first-time observer can identify progress, selected action and affected rival within three seconds.
- Desktop targets 60 fps and mobile targets 30 fps.
- Decorative motion respects both system and in-game reduced-motion settings.
- The world cannot capture pointer input or displace controls.
- Five deterministic states pass desktop, laptop and mobile visual review.
- Depth-plane order, fitted perspective, truth counts, render dimensions, source triangle/material/light budgets, passes and shipping bytes pass `npm run world:validate`.

## Solo operating cadence

Run one world experiment at a time:

1. Capture the five canonical states.
2. Grade composition, causality and readability before detail.
3. Choose the single highest-leverage gap.
4. Change one system: camera, large geometry, lighting, material, or response.
5. Rebuild and recapture identical fixtures.
6. Inspect the full-size comparison and the 240 px thumbnail.
7. Record the result and either keep or revert the experiment.

More props are not progress unless they improve orientation, causality, readable state, or delight.
