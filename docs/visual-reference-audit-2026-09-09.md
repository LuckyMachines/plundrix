# Visual Reference Audit - 2026-09-09

## Evidence reviewed

- Aspirational direction: `output/imagegen/plundrix-art-directions-2026-09-08/05-recommended-synthesis.png`
- Four source directions: `output/imagegen/plundrix-art-directions-2026-09-08/contact-sheet.png`
- Direct comparison: `app/reports/ui-review/latest/aspirational-reference-vs-current-active.png`
- Current journey sheet: `app/reports/ui-review/latest/contact-sheet.png`
- Type/layout sheet: `app/reports/ui-review/latest/type-layout-contact-sheet.png`
- Full-resolution renders: `app/reports/ui-review/latest/actual/`
- Prior depth evidence: `output/imagegen/plundrix-art-directions-2026-09-08/implementation/depth-comparison.png`
- Color-vision evidence: `output/imagegen/plundrix-art-directions-2026-09-08/implementation/color-vision-contact-sheet.png`

All 24 canonical desktop/mobile renders and four type/layout stress renders were inspected. The deterministic review passed 28/28 with no serious or critical Axe findings, horizontal overflow, clipped monitored controls, unloaded visible images, undersized type, or overlong measures.

## Judgment

Production ergonomics and responsive reliability: **A**.

Aspirational art-direction convergence across the whole product: **B-**.

The active Instant Play screen is a successful maintainable translation of the synthesis, not a literal raster copy. The broader product does not yet carry that language consistently. Vault Run, Career, and the live lobby still read primarily as clean dark dashboards. The current approved UI baselines are valid regression references, but their 0.000% differences only prove stability; they do not prove convergence to the aspirational synthesis.

## Reference convergence by surface

| Surface | Alignment | Evidence-based judgment |
| --- | ---: | --- |
| Player Hub | B | Clear choice architecture and strong CTA hierarchy. Background art helps, but the three equal rectangular cards and large empty lower field feel more like a premium landing page than a tactile caper table. |
| Instant Setup | B+ | Strong editorial headline, useful vault photograph, visible gadget, and disciplined choice hierarchy. Mobile removes most of the atmospheric object layer and becomes substantially flatter. |
| Instant Active | A- | Best translation. Vault, four dossiers, three action identities, real rules, and a near-plane commit control match the requested hierarchy. The vault is still much smaller and less spatially memorable than the synthesis. |
| Instant Resolution | A- | The causal result is legible and continuity into the next decision is strong. The large result strip competes with the vault and pushes the action moment lower than ideal. |
| Instant Final | B+ | The breach image, salvage, identity, and rematch action create a real reward moment. Desktop leaves a large inert lower field, while mobile copy crosses a bright image edge and loses some calm reading-plane quality. |
| Vault Run Route | C+ | Tradeoffs and heat are clear, but the screen is mostly flat cards and text. It lacks the living route diagram, paper layers, pins, and mischievous visual consequence promised by the blueprint reference. |
| Vault Run Active | C | Functional and readable, but visually closest to a conventional dashboard. Actions lose their tool silhouettes and distinctive control plates; the vault itself is absent as a visual object. |
| Workshop | B+ | The gadget hero and restrained brass treatment match the reference well. The surrounding chassis/material system returns to uniform boxes and does not yet feel like a physical bench or modular machine. |
| Career | C | Excellent information ordering, weak world-building. It reads as an account dashboard rather than an operator dossier: no artifact, portrait/silhouette, stamps, evidence trail, or meaningful material depth. |
| Replay Gallery | B | Strongest non-gameplay imagery and clear story differentiation. The photoreal cards feel richer than neighboring screens but drift away from the synthesis's editorial blueprint/paper vocabulary. |
| Live Lobby | C | Wallet and crew readiness are clear. The page is visually generic Web3 operations software, with little vault, dossier, route, or caper identity. |
| Live Active | C+ | The information architecture is sound and the disabled state is honest. Its lock tiles, player cards, charts, and action panels use a different visual dialect from Instant Play and make the two versions of the same game feel unrelated. |
| Type/layout stress | A | Long labels, dense values, and 320-1440px layouts remain readable. This proves robustness, not art-direction richness. |

## What is genuinely achieved

- The active game preserves the correct vault -> rivals -> action -> commit scan path.
- Pick, Search, and Sabotage have stable labels, colors, silhouettes, and explicit states.
- Production copy and actual game rules replaced the concept image's invented controls.
- Mobile reinterprets rather than uniformly shrinks the desktop layout.
- Brass is mostly reserved for locks, gadgets, and commitment peaks.
- Typography, target sizing, color-independent labels, overflow, and accessibility are strong.
- The implementation remains maintainable for one person instead of becoming a bespoke raster skin.

## Largest remaining gaps

1. **The caper system is not product-wide.** The reference language is concentrated in Instant Play, with weaker translation in Vault Run, Career, and live operations. This is the largest reason the product still feels partly generic.
2. **The vault is not yet the visual thesis.** The synthesis centers a dimensional mechanism and route. The current active screen reduces that to a narrow row of small lock dials, and several other game screens omit the vault object entirely.
3. **Tactility and mischief are underpowered.** The current system captures Impossible Blueprint structure but much less of Punchcard Caper's satisfying controls or Cut-Paper Caper's expressive interruptions. Most supporting surfaces remain flat rectangles on black, which the references explicitly asked us to avoid.

## Recommended next pass, in order

1. Extend the four shared depth layers to Vault Run, Career, and live operations before adding more isolated components.
2. Build one reusable large vault/route mechanism that can represent Instant, Vault Run, live play, resolution, and final states with different data.
3. Bring the live-game action plates and lock treatment into visual parity with Instant Play so the same rules feel like the same game.
4. Turn route choice into a physical planning board with paths, pins, visible risk, and a selected-route trace rather than three plain cards.
5. Turn Career into an operator dossier with a signature artifact, stamped progress, rival evidence, and one dominant next objective.
6. Give the lobby a heist-table object and seat/crew tokens so waiting feels like part of the fantasy instead of transaction setup.
7. Normalize generated art with one crop, grain, edge, and color-grade treatment; keep rich raster art for vault closeups, gadgets, and rewards.
8. Add restrained tactile feedback: lock seating, route tracing, punch-card confirmation, and a brief cut-paper sabotage snap, with reduced-motion equivalents.
9. Rebalance desktop canvases that leave large inert fields, especially Final, Career, Vault Route, and Live Lobby.
10. Validate the next pass with four newcomers before claiming improved comprehension, delight, or replay intent.

## Acceptance status

- [x] Correct game actions and rules remain authoritative.
- [x] Active Instant Play has a clear three-plane hierarchy.
- [x] Action states, responsive behavior, type, and accessibility pass automated gates.
- [x] Current and approved regression captures match at all 28 tested sizes/states.
- [ ] The vault is a memorable hero object across every gameplay mode.
- [ ] Vault Run, Career, and live operations visibly share the caper material system.
- [ ] Punchcard tactility and cut-paper mischief are present in interaction feedback, not only color accents.
- [ ] Generated imagery shares one coherent editorial/material treatment.
- [ ] Real-player evidence confirms the visual system improves understanding and joy.

## Perspective and depth note

The reference and current active game are front-on, near-orthographic interface compositions. A finite vanishing point is not credible, so no perspective overlay is appropriate. Existing relative-depth evidence uses `depth-anything/Depth-Anything-V2-Small-hf` and shows the desired broad plane ordering, but the current implementation still has less local material separation and foreground object depth than the synthesis.
