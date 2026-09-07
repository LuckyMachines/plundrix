# Plundrix Gadget Inventory

The Operator Workshop is an onchain live-match system and a no-wallet practice loop. Its catalog has ten meaningful chassis and 1,200 stable configurations:

```text
10 chassis x 10 material finishes x 12 calibration modules = 1,200 configurations
```

## Player-facing model

- **Chassis is gameplay.** Each of the ten silhouettes has one named, transparent, single-use signature.
- **Finish is expression.** It changes the material treatment and primary recipe material, never hidden match power.
- **Calibration is expression.** It adds a visible module and personality, never hidden match power.
- **Rarity is workmanship.** It changes crafting cost and visual prestige, never success odds.
- **Serial is permanence.** Every configuration retains its existing `gdt-####` ID and `PX-####` serial.

The UI leads with the ten chassis, then lets the player build one configuration. It never presents a flat wall of 1,200 equivalent products. Thirty combinations are authored signature builds with individual names and stories; every other record uses an honest finish/chassis/calibration name.

## Ten chassis signatures

| Chassis | Family | Live signature |
| --- | --- | --- |
| Precision Kit | Pick | +10 points to the first unstunned Pick. |
| Torque Driver | Pick | +18 points to the first Pick while carrying a tool. |
| Quickset Clamp | Pick | +14 points to an opening Pick at zero cracked locks. |
| Signal Scanner | Search | +20 points to the first Search. |
| Echo Coil | Search | +26 points to the first Search from round 3 onward. |
| Cache Siphon | Search | +12 points to the first Search; success finds up to two tools. |
| Route Compass | Search | The first Search ignores the stunned penalty and gains 10 points. |
| Firewall | Guard | Blocks the first incoming Sabotage. |
| Decoy Relay | Guard | Blocks the first Sabotage and removes one attacker tool when possible. |
| Counterweight | Guard | Blocks the first Sabotage and gains one tool when the attacker is ahead. |

The three action families remain easy to learn while the ten chassis now produce ten consequential loadout choices. `PlundrixGame` requests the deterministic signature from `PlundrixWorkshop` at the moment it can trigger. Ineligible conditional signatures remain armed.

## Visual composition

`GadgetVisual` combines four reusable layers:

1. the accepted transparent chassis master;
2. a finish-wide material tint and texture field;
3. one of twelve legible calibration-module glyphs;
4. rarity and authored-build detailing.

This creates visible variation without downloading 1,200 nearly identical raster files. The complete contact sheet uses each chassis image once per family and represents all configurations as finish-by-module matrices.

## Crafting and recovery

Recipes remain deterministic and use at most three of six materials. The workshop shows held quantities and exact deficits before assembly. A custom build can be reclaimed for half of each recipe material, rounded up; permanent starter builds cannot be reclaimed. Reclaiming an equipped build clears the onchain loadout and returns the local practice loadout to the starter Precision Kit.

## Contract and compatibility rules

- Existing blueprint IDs and the `10 x 10 x 12` decode order remain unchanged.
- Existing ownership, crafting, equipping, loadout locking, and settlement storage layouts remain unchanged.
- `consumeGadget` remains available for compatibility.
- `consumeGadgetEffect` is the new game-facing signature resolver.
- `reclaimBlueprint` adds a reversible material sink without adding storage slots.
- Both contracts remain independently upgradeable; deployment must rehearse the paired implementation update before enabling these signatures.

## Verification

Run from the repository root:

```powershell
npm --prefix app run test:inventory
forge test --match-contract PlundrixWorkshopTest
npm run sync:abi
npm --prefix app run build
```

Run from `app/` for the browser gate and visual evidence:

```powershell
npx playwright test tests/e2e/product.spec.js -g "workshop|tactical art"
$env:PLUNDRIX_CAPTURE_EVIDENCE='1'; npx playwright test tests/e2e/product.spec.js -g "capture workshop visual evidence"
```
