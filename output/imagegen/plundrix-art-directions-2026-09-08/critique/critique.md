# Plundrix recommended synthesis critique

Reviewed artifact: `../05-recommended-synthesis.png`

Current product capture: `../../../../../app/reports/ui-review/latest/actual/instant-active-desktop.png`

Comparison: `synthesis-vs-current.png`

Relative-depth comparison: `depth-comparison.png`

Depth model: `depth-anything/Depth-Anything-V2-Small-hf`

Perspective audit: `perspective-audit.md`

## Executive judgment

The synthesis is a strong art-direction target. It solves the current screen's generic flatness by making the vault a memorable spatial machine, separating information into tactile depth planes, and giving Pick, Search, and Sabotage distinct identities. It should guide a production system, but should not be reproduced as one large raster skin.

The production direction should keep its composition, color roles, and object hierarchy while simplifying texture, restoring real data density, and defining responsive and accessible interaction states in code.

## What works especially well

1. **The vault becomes the game's visual thesis.** The synthesis gives the locks, route, and central mechanism the strongest silhouette and the clearest narrative purpose. The current product reduces the vault to five small circles inside a large quiet rectangle.
2. **Depth carries meaning.** The relative-depth comparison shows a clear near plane for actions and gadgets, a middle plane for rivals, and a recessed planning plane for the vault. The current product reads primarily as two large flat planes with limited separation.
3. **Actions finally have personalities.** Pick is cool and precise, Search is green and investigative, and Sabotage is warm and dangerous. Their tools and silhouettes create recognition before reading.
4. **The visual language is ownable.** Blueprint construction, restrained brass, paper tabs, and mechanical controls feel like one heist world rather than a generic dark dashboard.
5. **The image balances seriousness and mischief.** The angular rival portraits and coral route marks add character without turning the entire interface into a cartoon.

## Largest gaps, ranked by leverage

### 1. Real information density is missing

- Reference evidence: the synthesis uses compact bars, dots, icons, and almost no explanatory copy.
- Current evidence: each rival currently carries a name, tool count, archetype description, grudge record, learned-behavior line, and readiness state. The action area also carries rules and probabilities.
- Consequence: a literal implementation would either lose gameplay comprehension or become much denser than the concept once real text returns.
- Fix: prototype the same frame with production copy before styling details. Reserve calm, low-texture reading planes behind names, rules, probabilities, errors, and wallet state. Treat the concept's abstract bars as optional summaries, never replacements for essential text.

### 2. Action affordance needs an explicit state system

- Reference evidence: the action panels are memorable, but the small hexagonal tabs sometimes look more clickable than the large Pick, Search, and Sabotage surfaces.
- Current evidence: the current product has conventional bordered cards and a selected accent, so the click region is less beautiful but more predictable.
- Consequence: players may not know whether the tool, label, panel, or side tab is the control. Keyboard focus, disabled actions, and a committed selection are not represented.
- Fix: make the entire action plate the button. Define default, hover, focus-visible, pressed, selected, committed, disabled, and unavailable states. Use the small tab as a state badge or confirmation indicator, not a competing target.

### 3. The concept invents flow semantics

- Reference evidence: the bottom rail includes `END ROUND`, `Turns left: 5`, `LOG`, and `OBJECTIVES`.
- Current evidence: instant play asks the player to commit one concealed action and resolves everyone together; those labels are not the current primary flow.
- Consequence: attractive generated controls can quietly rewrite the game loop and create false expectations.
- Fix: map every visible control to the actual engine state before implementation. Replace invented chrome with current concepts such as commit status, round resolution, challenge sharing, and exit. Keep the art direction; do not inherit accidental model-authored rules.

### 4. The visual hierarchy is strong but crowded

- Reference evidence: the vault, five locks, route map, left drafting sheets, right plan card, four rivals, actions, gadget tray, and bottom status rail all have meaningful visual weight.
- Current evidence: the current product is too flat, but its negative space leaves room for changing copy and system notices.
- Consequence: the synthesis could become tiring during repeated play and leave little room for errors, transaction states, tutorials, or longer localized strings.
- Fix: retain three emphasis levels only: hero mechanism, active decision, supporting state. Fade inactive drafting layers by roughly one contrast tier, collapse secondary plan details behind a drawer, and preserve one flexible utility zone.

### 5. Color cannot carry identity alone

- Reference evidence: rivals and actions are differentiated heavily through red, blue, green, and ochre.
- Current evidence: the current UI also uses written labels and distinct tool imagery.
- Consequence: color-vision differences, low-quality displays, and desaturation can erase meaning.
- Fix: pair every color role with a stable glyph, silhouette, label, and pattern. Validate contrast and meaning in grayscale and under common color-vision simulations.

### 6. Responsive behavior is unresolved

- Reference evidence: the synthesis is composed as one dense 1536x1024 instrument panel with persistent left and right wings.
- Current evidence: the product already has mobile captures and must support much narrower viewports.
- Consequence: scaling the concept down would create tiny text and targets; simply stacking every panel would produce a very long, exhausting screen.
- Fix: reinterpret rather than shrink. On mobile, keep lock progress and the chosen route at the top, make rivals a horizontal dossier carousel, keep actions in a sticky bottom decision tray, and move plans and gadgets into one accessible sheet. At tablet width, collapse only the right rail.

### 7. Material richness needs a maintainable implementation rule

- Reference evidence: nearly every surface has its own edge wear, paper grain, inset shadow, brass pin, and unique geometry.
- Current evidence: the existing system uses reusable CSS panels and small art assets, which is easier for one developer to maintain.
- Consequence: literal bespoke assets would multiply responsive, theming, performance, and state-maintenance costs.
- Fix: implement four reusable layers: work surface, information plane, active control, and dramatic overlay. Use CSS for borders, elevation, states, and color; use a small atlas for paper fibers, brass hardware, character silhouettes, and tool cutouts.

### 8. Motion and feedback are implied but unspecified

- Reference evidence: route pins, lock rings, paper tabs, and punchcard-like indicators all suggest satisfying movement.
- Current evidence: the static product capture cannot convey reveal timing or action feedback.
- Consequence: a visually rich static implementation could still feel lifeless, while excessive motion could overwhelm or harm accessibility.
- Fix: define one motion signature per action: Pick clicks and aligns, Search scans and reveals, Sabotage snaps and tears. Lock progress should rotate and seat. Support reduced motion with opacity, color, and sound-independent confirmation.

## Recommended production translation

- Use the synthesis as the desktop art-direction reference, not as a pixel-perfect skin.
- Preserve the central vault proportions and three-level depth hierarchy.
- Bring current real text into a low-texture prototype before producing final assets.
- Build one reusable action-plate component with semantic variants for Pick, Search, and Sabotage.
- Build one dossier component that supports full names, status, ability copy, and accessible patterns.
- Create mobile and tablet compositions before locking decorative geometry.
- Restrict bespoke raster art to the vault face, rival portraits, gadget cutouts, and a small texture atlas.

## Acceptance checklist

- [x] Central vault and route are the first visual focal point at desktop size.
- [x] Pick, Search, and Sabotage have distinct silhouettes and color roles.
- [x] Relative depth separates planning, rival, action, and gadget planes.
- [x] Visual direction feels authored and materially coherent.
- [x] All current production copy fits without shrinking below the type-system minimums.
- [x] Default, hover, focus, pressed, selected, committed, disabled, and unavailable states are captured.
- [x] Every concept control maps to an existing or deliberately approved game action.
- [x] Desktop, tablet, and mobile compositions preserve hierarchy without simple uniform scaling.
- [x] Grayscale, contrast, keyboard, reduced-motion, and text-scaling checks pass.
- [x] Asset count and rendering cost remain appropriate for a solo-maintained product.

## Verification record

- [x] Inspected the synthesis and current comparison at original resolution.
- [x] Generated and inspected relative-depth maps for both images.
- [x] Verified both source images and evidence files decode successfully.
- [x] Captured responsive production implementation states and approved the intentional baselines.
- [x] Verified interaction geometry and layout stability through the canonical UI matrix.
- [x] Ran production build, complete release, typography, accessibility, and color-vision gates.

Implementation review and reproducible evidence: `../implementation/review.md`
