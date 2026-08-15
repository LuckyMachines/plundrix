# Homepage Visual Acceptance Record

Date: 2026-08-13

## Evidence

- Baseline desktop: `baseline/home-desktop.png`
- Baseline mobile: `baseline/home-mobile.png`
- Final desktop: `final/home-desktop.png`
- Final mobile: `final/home-mobile.png`
- Baseline/final comparison: `final/baseline-vs-final-desktop.png`

## Largest baseline gaps

1. The environment error and loading skeletons dominated the first viewport; visitors could not see the game.
2. No visual subject expressed a vault heist, five locks, simultaneous decisions, or table pressure.
3. Dense navigation and dim secondary text made the interface feel like an internal operations tool.

## Acceptance checklist

- [x] The vault is the dominant first-viewport subject.
- [x] The headline and supporting copy explain the fantasy and strategic tension without insider terminology.
- [x] Pick, Search, and Sabotage are visible and differentiated before live configuration is required.
- [x] A visitor can interact with a representative turn without a wallet.
- [x] Replay proof is visible and links to deterministic replay pages.
- [x] Contract/service failure does not replace the marketing experience.
- [x] Desktop 1440x1000 and iPhone 13 captures preserve hierarchy with no horizontal overflow.
- [x] Secondary text contrast is materially stronger than the baseline.
- [x] All primary controls retain at least 44 px target height.
- [x] Generated artwork contains no text, logo, or watermark.

## Image generation record

- Mode: local Azure GPT Image 2 wrapper requested by the project owner.
- Source: `public/images/plundrix-vault-hero.png`
- Web derivative: `public/images/plundrix-vault-hero.webp`
- Prompt: "Use case: stylized-concept. Asset type: landing page hero artwork for a competitive vault-heist strategy game. A monumental circular bank-vault locking mechanism half-open inside a clandestine high-tech heist workshop, with five readable locking bolts; premium painterly 3D key art; oxidized brass, blackened steel, worn enamel; center-right vault with calm shadowed left space; warm amber interior against cool near-black shadows; charcoal, gunmetal, aged brass, restrained teal and red signals; no people, coins, treasure, text, letters, logo, watermark, UI, or border."

## Remaining intentional gaps

- The local capture has no contract address, so the live table shows its designed unavailable state rather than populated operations.
- No external visual reference was supplied; this pass compares the prior product against the revised product, so perspective/depth matching evidence is not applicable.
- Live lobby, active-match, and resolution captures remain on the product checklist.
