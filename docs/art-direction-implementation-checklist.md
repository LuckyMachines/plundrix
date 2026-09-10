# Caper Art Direction Implementation Checklist

Date: 2026-09-08

Reference: `output/imagegen/plundrix-art-directions-2026-09-08/05-recommended-synthesis.png`

Implementation evidence: `output/imagegen/plundrix-art-directions-2026-09-08/implementation/`

## P0 - Preserve the real game

- [x] Keep Pick, Search, Sabotage, simultaneous reveal, real odds, tools, targets, and current round state intact.
- [x] Reject generated controls and rules that are not implemented by the engine.
- [x] Keep required copy on calm information planes at or above the type-system floor.

## P1 - Establish the visual grammar

- [x] Add reusable work-surface, information-plane, control-plane, and dramatic-overlay tokens.
- [x] Make the vault and its five locks the primary spatial mechanism.
- [x] Give Pick, Search, and Sabotage stable color, label, silhouette, and pattern identities.
- [x] Reserve brass for the vault, rare objects, and commitment peaks.

## P2 - Make interaction state explicit

- [x] Make each complete action plate the control.
- [x] Define ready, hover, focus, pressed, selected, committed, disabled, and unavailable behavior.
- [x] Use visible state labels in addition to color.
- [x] Apply the state vocabulary to Instant Play and the live-game action cards.

## P3 - Recompose responsively

- [x] Keep lock progress near the top on mobile.
- [x] Turn rivals into a horizontal snap carousel on mobile.
- [x] Keep the selected action and commitment controls in a persistent mobile dock.
- [x] Move supporting table intel into an accessible drawer below desktop width.
- [x] Preserve the desktop vault, dossiers, decision, and commit action in one viewport.

## P4 - Make the system inspectable

- [x] Add production vault, dossier, action, layer, and state specimens to `/design-system`.
- [x] Add deterministic interaction coverage for action states and the responsive intel drawer.
- [x] Capture and approve changed canonical baselines with written reasons.
- [x] Compare the implementation directly against the approved synthesis.
- [x] Generate and inspect depth, grayscale, protanopia, deuteranopia, and tritanopia evidence.

## P5 - Verification

- [x] Pass the 28-render canonical UI and type/layout matrix.
- [x] Pass accessibility, overflow, image, font, measure, and clipping checks.
- [x] Pass the complete 11-check release gate with no failures or flakes.
- [x] Keep production raster count unchanged; geometry and interaction states remain CSS/component driven.

## Evidence that still requires people

- [ ] Observe four newcomers identifying the primary action and explaining a round result without facilitation.
- [ ] Observe at least one player who regularly uses enlarged text.
- [ ] Record whether the caper treatment improves recognition, delight, and desire for another run.
