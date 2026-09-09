# Plundrix Art-Direction Studies - September 9, 2026

This packet extends the approved Plundrix synthesis into four product surfaces that were still visually behind the core game: Vault Run, Career, the live lobby, and the player hub.

## Recommendation

Use `11-recommended-synthesis-final.png` as the definitive active-operation reference. It combines the system-level composition of the Heist Desk Hub with the strongest specialized ideas from the other studies:

- `06-living-vault.png`: the vault is a real mechanism and route choices physically connect to it.
- `07-crooked-dossier.png`: progression reads as accumulated evidence, not analytics cards.
- `08-crew-briefing-table.png`: multiplayer seats, readiness, and launch progress form one social ritual.
- `09-heist-desk-hub.png`: one warm primary action, persistent mode tabs, and a recurring vault symbol unify the product.

The first synthesis attempt is preserved as `10-recommended-synthesis-v2.png`. It established the composition but was rejected because it reintroduced animal portraits and replaced turn actions with navigation. The corrected final restores anonymous mask insignias and the Pick/Search/Sabotage/Confirm Move loop.

Do not ship these images as full-screen backgrounds. Rebuild the hierarchy, geometry, and state grammar in HTML/CSS, then use modular raster assets only for textures, emblems, paper edges, mechanism faces, stamps, and gadget cutouts. Keep all product text and live state code-rendered.

## Evidence

- `contact-sheet.png`: the four studies at a glance.
- `comparisons/`: each study beside the current product surface.
- `comparisons/11-synthesis-vs-current-active.png`: the final synthesis beside the current active game.
- `depth/`: relative monocular depth evidence generated with `depth-anything/Depth-Anything-V2-Small-hf`. Warm/bright is relatively near and cool/dark is relatively far; it is not metric depth.
- `critique.md`: findings and recommended synthesis.
- `acceptance-checklist.md`: completed and intentionally open gates.

The studies use a straight-on, near-orthographic interface camera. There are no credible perspective convergence lines to calibrate, so a finite vanishing-point hypothesis would be misleading and is intentionally omitted.

## Generation

- Model: Azure-hosted `gpt-image-2`
- Quality: high
- Native size: 1536x1024 PNG
- Prompts: saved beside each image as `*.prompt.txt`
