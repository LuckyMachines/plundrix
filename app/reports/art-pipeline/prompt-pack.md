# Plundrix Art Prompt Pack

Art system: 1.3.0

Generated: 2026-09-06T22:27:02.838Z

Generate one asset at a time. Save an accepted master at the intended source path, then run the build and validation commands.

## Vault hero

- ID: `vault-hero`
- Family: `vault-atmosphere`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/plundrix-vault-hero.png`

```text
Use case: stylized-concept
Asset type: cinematic game and website atmosphere
Primary request: Introduce one imposing vault that feels precise, competitive, and possible to crack.
Input images: Image 1: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: A clandestine industrial strategy chamber centered on one monumental vault door.
Subject: One vault mechanism surrounded by restrained operator infrastructure. Reusable parts: one monumental circular bank-vault mechanism with a strong uninterrupted silhouette; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; fine blueprint-blue circuitry or etched planning lines used as a quiet connective accent; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Square master with strong central symmetry and calm edge space that survives a wide crop. Strong architectural depth, one central vault anchor, restrained detail at copy edges.
Lighting/mood: Warm amber rim light on the vault against cool, near-black chamber shadows. Tense, inviting, sophisticated, and tactile rather than explosive.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: anticipation. The vault looks formidable but visibly operable, inviting the first choice.
Restraint: No breach yet; keep the promise unresolved.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no people; no fake UI; no treasure spectacle; one uninterrupted vault face; no decorative repeated lock modules; Use exactly five distinct lock stages only when the stages are individually visible.; A station implies one player position without depicting an unverified human player.; Blue communicates system guidance or connection, not magic.; Negative space must remain free of focal props and generated text.
Avoid: multiple competing vault doors; horror imagery; empty generic sci-fi corridor
Output intent: 1024x1024 source master saved as assets/art-source/scenes/plundrix-vault-hero.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Instant breach

- ID: `instant-breach`
- Family: `mode-key-art`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/plundrix-instant-breach.png`
- Deterministic composition: 5 instances of `assets/art-source/parts/lock-module.png` at 104px

Generation-stage prompt:

```text
Create a square 1024x1024 text-free cinematic game environment base for a premium industrial vault strategy game. COMPOSITE BASE ONLY: show exactly four empty workstations, all separate: one large player workbench across the lower foreground and exactly three smaller plain mechanical rival benches in the middle distance at left, center, and right. Behind them is one wide, completely blank, flat blackened-steel vault panel occupying the upper-right half, intentionally empty for five lock modules that will be composited later. The blank vault panel must contain zero locks, zero circles, zero holes, zero dials, zero gauges, and zero decorations. Each workstation uses only simple unlabeled levers and a few precision hand tools. No screens, monitors, digital displays, gauges, keyboards, chairs, writing, letters, numbers, labels, symbols, logos, watermarks, borders, people, robots, body parts, or faces. Premium painterly 3D game art, physically grounded blackened steel, aged brass, worn enamel, warm amber task light against cool near-black shadows. Preserve calm dark low-detail negative space in the upper-left for later HTML copy. Competitive and welcoming, not menacing. Image only.
```

Final creative brief:

```text
Use case: stylized-concept
Asset type: Player Hub mode-card artwork
Primary request: Make solo play against three readable mechanical rivals feel immediate and welcoming.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: A compact clandestine training vault shared by one foreground workbench and three rival stations.
Subject: EXACT COUNTS: four empty workstations total - one foreground player bench and exactly three smaller unoccupied rival consoles - facing exactly five lock cylinders total on the vault face. Reusable parts: exactly five clearly separated lock stages arranged as one readable progression, with no extra lock-like rings; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; an unoccupied tabletop rival console with a distinct instrument silhouette; it is machinery, never a robot body; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Square card art weighted right and low with a calm dark upper-left copy field. Square master with the focal machinery weighted right and low; reserve the upper-left for HTML copy.
Lighting/mood: Warm approachable vault light with subtle cool separation between the three rivals. Approachable pressure with a clear invitation to act.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: invitation. The waiting rival stations make the table feel alive before the first action.
Restraint: Competitive, not menacing; no blockchain imagery.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no faces; no blockchain iconography; no fake controls; exactly three unoccupied rival consoles; exactly one foreground player workbench; exactly five visible lock cylinders total; all surfaces are free of writing and labels; Exactly five lock stages; never add decorative lock-like modules.; A station implies one player position without depicting an unverified human player.; The rival reads as an agent-controlled station without a face, head, torso, limbs, hands, or human participant.; Negative space must remain free of focal props and generated text.
Avoid: people; humanoid robots; heads; torsos; arms; hands; screens; gauges with letters or numerals; extra lock-like circles; crowded upper-left detail; victory before play begins
Output intent: 1024x1024 source master saved as assets/art-source/scenes/plundrix-instant-breach.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Live breach

- ID: `live-breach`
- Family: `mode-key-art`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/plundrix-live-breach-gpt-image-2.png`

```text
Use case: stylized-concept
Asset type: Player Hub mode-card artwork
Primary request: Communicate four connected competitors making simultaneous decisions around one vault.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: A dark metal strategy table with four empty stations connected to one five-lock vault.
Subject: Four grounded operator terminals linked by quiet blueprint circuitry and one sabotage trace. Reusable parts: exactly five clearly separated lock stages arranged as one readable progression, with no extra lock-like rings; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; fine blueprint-blue circuitry or etched planning lines used as a quiet connective accent; one severed braided cable emitting a restrained red spark and a traceable path toward a rival station; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Square table perspective weighted right and low with calm dark upper-left space. Square master with the focal machinery weighted right and low; reserve the upper-left for HTML copy.
Lighting/mood: Amber vault glow, restrained blue connection light, and exactly one red sabotage path. Approachable pressure with a clear invitation to act.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: social tension. Every station points toward the same prize while one red path implies betrayal.
Restraint: Connected competition without crypto symbols or fake players.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no faces; no blockchain iconography; no fake controls; exactly four operator stations; exactly one shared vault; fine connection paths remain secondary; Exactly five lock stages; never add decorative lock-like modules.; A station implies one player position without depicting an unverified human player.; Blue communicates system guidance or connection, not magic.; Sabotage disrupts a rival; avoid indiscriminate destruction.; Negative space must remain free of focal props and generated text.
Avoid: network-map abstraction; human figures; multiple red effects
Output intent: 1024x1024 source master saved as assets/art-source/scenes/plundrix-live-breach-gpt-image-2.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Comeback

- ID: `replay-comeback`
- Family: `replay-story`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/replay-comeback.png`

```text
Use case: stylized-concept
Asset type: replay gallery narrative poster
Primary request: Capture the hopeful instant when a trailing player earns one last credible route back into the race.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: A battered operator bench at the vault during a late-round recovery.
Subject: A precision lockpick finding purchase while a previously dark mechanism begins to glow. Reusable parts: exactly five clearly separated lock stages arranged as one readable progression, with no extra lock-like rings; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; a precision brass lockpick under focused amber task light; controlled warm light escaping through a newly opened mechanical seam.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Close, square narrative crop with one diagonal from the tool to the responding lock. Square master, one story beat, readable at card scale, no embedded title.
Lighting/mood: A small warm comeback spark growing against deep cool pressure. Specific, dramatic, and worth retelling.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: hope. The tool-to-lock cause is instantly readable and the race still feels undecided.
Restraint: Show renewed possibility, not a guaranteed win.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; show one cause and one consequence; no generic action collage; no fake match UI; one recovering station; one readable lock response; Exactly five lock stages; never add decorative lock-like modules.; A station implies one player position without depicting an unverified human player.; Pick is the direct attempt to crack a lock.; A breach should feel earned and precise rather than explosive.
Avoid: victory pose; scoreboard; generic triumphant explosion
Output intent: 1024x1024 source master saved as assets/art-source/scenes/replay-comeback.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Sabotage

- ID: `replay-sabotage`
- Family: `replay-story`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/replay-sabotage.png`

```text
Use case: stylized-concept
Asset type: replay gallery narrative poster
Primary request: Show a clever disruption as a specific cause and consequence, not indiscriminate destruction.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference
Scene/backdrop: A rival workbench immediately after one precise act of sabotage.
Subject: A stolen tool across one severed cable while its path back to the rival station remains visible. Reusable parts: an empty, grounded operator workbench with tactile unlabeled levers and precision tools; a precision brass lockpick under focused amber task light; one severed braided cable emitting a restrained red spark and a traceable path toward a rival station.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Tight square still life with the cable path leading through the frame. Square master, one story beat, readable at card scale, no embedded title.
Lighting/mood: Restrained red spark against warm brass and quiet cool shadows. Specific, dramatic, and worth retelling.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: mischief. The viewer can understand exactly what was stolen and who was disrupted.
Restraint: One surgical spark; never an explosion.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; show one cause and one consequence; no generic action collage; no fake match UI; one severed cable; one displaced tool; damage remains mechanically plausible; A station implies one player position without depicting an unverified human player.; Pick is the direct attempt to crack a lock.; Sabotage disrupts a rival; avoid indiscriminate destruction.
Avoid: fireball; weapons; anonymous rubble
Output intent: 1024x1024 source master saved as assets/art-source/scenes/replay-sabotage.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Close finish

- ID: `replay-close-finish`
- Family: `replay-story`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/replay-close-finish.png`

```text
Use case: stylized-concept
Asset type: replay gallery narrative poster
Primary request: Make simultaneous final-lock pressure feel readable at a glance.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Four operator stations converge on the last stage of one shared vault.
Subject: Four distinct tool paths arriving at one nearly breached final lock. Reusable parts: exactly five clearly separated lock stages arranged as one readable progression, with no extra lock-like rings; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; a precision brass lockpick under focused amber task light; controlled warm light escaping through a newly opened mechanical seam.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Square radial composition with all paths resolving at one central lock. Square master, one story beat, readable at card scale, no embedded title.
Lighting/mood: Balanced station accents around a tightly controlled amber final-lock glow. Specific, dramatic, and worth retelling.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: suspense. Four readable paths arrive together, making the outcome feel genuinely uncertain.
Restraint: Freeze the instant before the winner is known.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; show one cause and one consequence; no generic action collage; no fake match UI; exactly four station paths; one unresolved final lock; Exactly five lock stages; never add decorative lock-like modules.; A station implies one player position without depicting an unverified human player.; Pick is the direct attempt to crack a lock.; A breach should feel earned and precise rather than explosive.
Avoid: declared winner; confetti; multiple focal locks
Output intent: 1024x1024 source master saved as assets/art-source/scenes/replay-close-finish.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Home social card

- ID: `social-home`
- Family: `social-source`
- Status: `accepted`
- Intended source: `assets/social-source/plundrix-home-gpt-image-2.png`

```text
Use case: stylized-concept
Asset type: text-free social-card scene master
Primary request: Make the shared vault and simultaneous rivalry legible in a fast-moving social feed.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: The monumental vault chamber seen from the operator table.
Subject: One vault anchor with subtle evidence of multiple competing stations. Reusable parts: one monumental circular bank-vault mechanism with a strong uninterrupted silhouette; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; fine blueprint-blue circuitry or etched planning lines used as a quiet connective accent; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Landscape source with all essential detail in the right 55 percent and a calm left copy field. Landscape master with a calm left field and focal machinery to the right.
Lighting/mood: High-contrast amber vault light with restrained cool circuitry. Immediate, premium, and high contrast at feed size.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: curiosity. The unopened vault promises a shared decision with visible stakes.
Restraint: Mystery without visual vagueness.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no baked-in text; no logos; protect the left copy field; single dominant vault; Use exactly five distinct lock stages only when the stages are individually visible.; A station implies one player position without depicting an unverified human player.; Blue communicates system guidance or connection, not magic.; Negative space must remain free of focal props and generated text.
Avoid: centered detail behind the headline; small intricate silhouettes
Output intent: 1536x1024 source master saved as assets/social-source/plundrix-home-gpt-image-2.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Instant Play social card

- ID: `social-play`
- Family: `social-source`
- Status: `accepted`
- Intended source: `assets/social-source/plundrix-play-gpt-image-2.png`

```text
Use case: stylized-concept
Asset type: text-free social-card scene master
Primary request: Promise a ready-to-play agent table with no wallet barrier.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: A waiting training vault with three mechanical rival stations.
Subject: A prepared operator bench facing three distinct mechanical rivals. Reusable parts: exactly five clearly separated lock stages arranged as one readable progression, with no extra lock-like rings; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; an unoccupied tabletop rival console with a distinct instrument silhouette; it is machinery, never a robot body; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Landscape source with the table on the right and a protected left copy field. Landscape master with a calm left field and focal machinery to the right.
Lighting/mood: Warm ready-state light with subtle rival separation. Immediate, premium, and high contrast at feed size.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: readiness. Everything appears set for an immediate first choice.
Restraint: No implied wallet or chain setup.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no baked-in text; no logos; protect the left copy field; exactly three mechanical rivals; Exactly five lock stages; never add decorative lock-like modules.; A station implies one player position without depicting an unverified human player.; The rival reads as an agent-controlled station without a face, head, torso, limbs, hands, or human participant.; Negative space must remain free of focal props and generated text.
Avoid: human faces; crypto marks; empty unprepared table
Output intent: 1536x1024 source master saved as assets/social-source/plundrix-play-gpt-image-2.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Trailer social card

- ID: `social-trailer`
- Family: `social-source`
- Status: `accepted`
- Intended source: `assets/social-source/plundrix-trailer-gpt-image-2.png`

```text
Use case: stylized-concept
Asset type: text-free social-card scene master
Primary request: Compress the five-lock, four-player promise into one cinematic frame.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: A shared vault table at peak pre-resolution pressure.
Subject: Four operator stations focused on one five-lock vault. Reusable parts: exactly five clearly separated lock stages arranged as one readable progression, with no extra lock-like rings; an empty, grounded operator workbench with tactile unlabeled levers and precision tools; one severed braided cable emitting a restrained red spark and a traceable path toward a rival station; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Landscape source with the competitive geometry on the right and a protected left copy field. Landscape master with a calm left field and focal machinery to the right.
Lighting/mood: Peak warm lock light with a single controlled sabotage-red accent. Immediate, premium, and high contrast at feed size.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: dramatic anticipation. All four positions point at the same nearly solved mechanism.
Restraint: Do not reveal a winner.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no baked-in text; no logos; protect the left copy field; exactly four stations; exactly five lock stages; Exactly five lock stages; never add decorative lock-like modules.; A station implies one player position without depicting an unverified human player.; Sabotage disrupts a rival; avoid indiscriminate destruction.; Negative space must remain free of focal props and generated text.
Avoid: victory celebration; baked-in trailer controls; extra lock-like circles
Output intent: 1536x1024 source master saved as assets/social-source/plundrix-trailer-gpt-image-2.png
```

Acceptance checks:

- [x] focal subject reads at 240px wide
- [x] no text, logo, watermark, fake UI, coins, or treasure
- [x] mechanical details match the declared gameplay truth
- [x] desktop and mobile crops preserve the focal beat

## Lock module part

- ID: `part-lock-module`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/lock-module.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create one modular lock stage that can represent calm, pressured, cracked, and breached states through external lighting.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One complete radial lock module with a blackened-steel body, brass mechanism, and a simple central keyhole. Reusable parts: one self-contained radial lock stage with a mechanically plausible central keyway and broad blank metal surfaces.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered object in a consistent three-quarter view with 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key light; no baked-in semantic glow. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: mastery. Fine mechanical detail makes progress feel tactile.
Restraint: The base part remains neutral so state color can be applied in the interface.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; complete silhouette; one module only; This is one modular stage, not an entire vault or a cluster of locks.
Avoid: scene background; floating debris; numerals; colored state lighting
Output intent: 1024x1024 source master saved as assets/art-source/parts/lock-module.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 96px
- [x] no state color is baked in

## Pick tool part

- ID: `part-pick-tool`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/pick-tool.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create the canonical Pick tool as a satisfying, mechanically plausible object.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One precision brass lockpick with a blackened-steel grip and subtle wear. Reusable parts: a precision brass lockpick under focused amber task light.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single diagonal object, complete silhouette, consistent three-quarter view, 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key light with a restrained warm edge. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: agency. The fine tip and worn grip imply skill and repeated use.
Restraint: No sparks or success state in the neutral part.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one tool only; complete silhouette; Pick is the direct attempt to crack a lock.
Avoid: weapon silhouette; hand; scene dressing; glowing magic effect
Output intent: 1024x1024 source master saved as assets/art-source/parts/pick-tool.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] tool reads as lockpicking equipment rather than a weapon
- [x] silhouette reads at 96px

## Search kit part

- ID: `part-search-kit`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/search-kit.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create the canonical Search kit with one visible useful discovery and room for external state effects.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact opened field kit containing precision tools and one empty fitted compartment. Reusable parts: an opened field kit revealing one useful precision tool with a restrained green discovery glint.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered kit, open at a readable angle, complete silhouette, 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key light; only a faint restrained green reflection. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: discovery. The fitted compartments suggest the satisfaction of finding exactly the needed tool.
Restraint: Do not imply a guaranteed powerful reward.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; single coherent kit; complete silhouette; Search finds tools; it does not directly crack a lock.
Avoid: treasure chest; coins; loot explosion; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/search-kit.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] kit reads at 96px
- [x] object does not resemble a treasure chest

## Sabotage cable part

- ID: `part-sabotage-cable`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/sabotage-cable.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create one modular severed cable that communicates disruption without explosive violence.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One short braided industrial cable with a cleanly severed end, copper strands, and a small connector. Reusable parts: one severed braided cable emitting a restrained red spark and a traceable path toward a rival station.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single curved object with complete silhouette and 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key light; no baked-in spark so animation can supply state. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: mischief. The clean cut creates an instantly readable consequence.
Restraint: No destruction beyond the cable itself.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one cable only; complete silhouette; Sabotage disrupts a rival; avoid indiscriminate destruction.
Avoid: electric arc; fire; explosion; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/sabotage-cable.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] cable reads at 96px
- [x] no spark or state effect is baked in

## Victory breach

- ID: `victory-breach`
- Family: `outcome-key-art`
- Status: `accepted`
- Intended source: `assets/art-source/scenes/victory-breach.png`

```text
Use case: stylized-concept
Asset type: game victory and resolution backdrop
Primary request: Show the vault opening as earned mechanical release and give the final result a memorable emotional peak.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: The same clandestine blackened-steel vault chamber immediately after a successful breach.
Subject: A tight macro view of one opened vault seam with controlled warm light beyond it; the overall lock count is deliberately outside the frame. Reusable parts: one monumental circular bank-vault mechanism with a strong uninterrupted silhouette; controlled warm light escaping through a newly opened mechanical seam; a calm, low-detail dark field reserved for live interface copy.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Square master with the glowing open seam weighted right, low-detail shadow through the center, and no complete locking ring visible in a shallow 1024x420 crop. Square master designed to survive a shallow banner crop, with a calm center field for live result text.
Lighting/mood: Warm light escapes through the open seam into cool near-black shadows; restrained dust motes only. Earned relief, warm release, and quiet mechanical satisfaction rather than spectacle.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: earned release. A precise mechanical opening pays off the tension of every earlier choice.
Restraint: Quiet triumph without loot, fireworks, or a fabricated crowd.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; no people; no treasure or coins; no fake interface; preserve live-copy legibility; one open vault seam only; overall bolt count remains outside the frame; center remains calm enough for live winner copy; Use exactly five distinct lock stages only when the stages are individually visible.; A breach should feel earned and precise rather than explosive.; Negative space must remain free of focal props and generated text.
Avoid: coins; treasure; cash; people; confetti; explosion; text; fake interface
Output intent: 1024x1024 source master saved as assets/art-source/scenes/victory-breach.png
```

Acceptance checks:

- [x] opened vault seam reads in the 1024x420 crop without presenting a conflicting lock count
- [x] no text, treasure, explosion, or people
- [x] warm release supports rather than obscures live result text

## Precision Kit gadget

- ID: `part-precision-kit`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/precision-kit.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create the canonical Precision Kit as a compact collectible equipment module.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One fitted blackened-steel tool tray containing exactly three fine brass lock tools and one tension collar. Reusable parts: one compact fitted precision kit with three fine lock tools and a brass tension collar.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered kit in three-quarter view with a complete silhouette and 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio light with a restrained amber edge. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: prepared confidence. Ordered, purpose-built tools make the next Pick feel skillful.
Restraint: No hands, weapons, sparks, or success state.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one coherent kit; exactly three fine tools; The Precision Kit improves a Pick attempt; it is equipment, not a weapon.
Avoid: text; numbers; logos; treasure chest; hand; weapon; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/precision-kit.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] reads as precision equipment at 72px
- [x] contains no writing or weapon silhouette

## Signal Scanner gadget

- ID: `part-signal-scanner`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/signal-scanner.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create the canonical Signal Scanner as a compact analog discovery instrument.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One handheld-sized blackened-steel signal scanner with an aged brass frame and a single green glass lens. Reusable parts: one compact analog signal scanner with a single green glass lens and no display.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered object in three-quarter view with a complete silhouette and 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio light with a faint green lens reflection. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: curiosity. The one luminous lens suggests a hidden signal waiting to be found.
Restraint: No digital UI or guaranteed reward.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one scanner only; one green lens only; The Signal Scanner improves Search; it reveals information rather than opening a lock.
Avoid: screen; gauge; waveform; text; numbers; hand; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/signal-scanner.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] one lens reads at 72px
- [x] no screen, gauge, writing, or pseudo-text

## Firewall gadget

- ID: `part-firewall`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/firewall.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create the canonical Firewall as a sturdy physical relay that can absorb one disruption.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One dense blackened-steel relay with overlapping shutters, sturdy feet, and oxidized copper heat fins. Reusable parts: one dense defensive relay with overlapping steel shutters and oxidized copper heat fins.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered object in three-quarter view with a complete silhouette and 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio light with a cool protective rim. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: security. Layered shutters make one saved turn feel physically credible.
Restraint: No literal wall, shield badge, fire, or invulnerability spectacle.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one relay only; compact readable silhouette; The Firewall absorbs one sabotage attempt; it is protective equipment, not a shield emblem.
Avoid: shield symbol; flames; castle wall; text; numbers; screen; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/firewall.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] reads as defensive equipment at 72px
- [x] contains no shield emblem, fire, or writing

## Rook identity device

- ID: `part-rook-device`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/rook-device.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Give Rook a distinct mechanical identity that communicates decisive pressure.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact high-torque lock-driving piston on a broad stable base, with one warm amber pressure chamber. Reusable parts: one compact high-torque lock-driving piston with a broad stable base and warm amber mechanism.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered squat object, complete silhouette, readable from the front at 64px. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio light with restrained amber reflection. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: competitive recognition. The poised piston makes Rook feel ready to close the race.
Restraint: Mechanical device only, never a character body or weapon.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one device only; broad stable silhouette; Rook is the closer agent; show decisive pressure without a face or humanoid body.
Avoid: face; eyes; limbs; robot body; gun; text; logo; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/rook-device.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] reads as a forceful device at 64px
- [x] has no face, limbs, weapon silhouette, or writing

## Mara identity device

- ID: `part-mara-device`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/mara-device.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Give Mara a distinct mechanical identity that communicates patient tool collection.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact rotating tool carousel with nested precision implements and one restrained green find-light. Reusable parts: one compact rotating tool carousel with nested precision implements and a restrained green find-light.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered triangular object, complete silhouette, readable from the front at 64px. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio light with a restrained green reflection. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: competitive recognition. Nested tools make Mara’s scavenger behavior visible before reading the copy.
Restraint: Mechanical device only, never a character body or treasure pile.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one device only; nested tools remain legible; Mara is the scavenger agent; show patient tool collection without a face or humanoid body.
Avoid: face; eyes; limbs; robot body; treasure; text; logo; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/mara-device.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] reads as a collecting device at 64px
- [x] has no face, limbs, treasure, or writing

## Vesper identity device

- ID: `part-vesper-device`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/vesper-device.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Give Vesper a distinct mechanical identity that communicates targeted interference.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact forked cable-intercept relay with two insulated prongs and one restrained red enamel cut-line. Reusable parts: one compact forked cable-intercept relay with a restrained red cut-line accent.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered forked object, complete silhouette, readable from the front at 64px. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio light with a restrained red reflection. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: competitive recognition. The forked relay makes Vesper’s targeted disruption immediately legible.
Restraint: Mischievous machinery, not a weapon or violent character.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one device only; two prongs only; Vesper is the disruptor agent; show targeted interference without a face or humanoid body.
Avoid: spark; electric arc; crosshair; weapon; face; eyes; limbs; text; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/vesper-device.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] reads as a disrupting device at 64px
- [x] has no sparks, face, limbs, weapon silhouette, or writing

## Open breach seal

- ID: `part-breach-seal`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/breach-seal.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create one opened vault seal that can reward a win without importing an entire scene.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One blackened-steel pentagonal vault seal with exactly one retracted brass latch at each of its five corners and controlled warm light through the center seam. Reusable parts: one opened radial vault seal with retracted latches and controlled warm light through its center seam; controlled warm light escaping through a newly opened mechanical seam.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: Single centered five-sided open mechanism, complete silhouette, front three-quarter view, 12 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with controlled warm light from within the opening. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: earned release. The retracted latches make completion tactile and unmistakable.
Restraint: No loot, confetti, debris, or explosive force.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one seal only; five retracted latches; The open seal communicates earned victory without coins, loot, or explosive debris.; A breach should feel earned and precise rather than explosive.
Avoid: coins; treasure; explosion; debris; text; numbers; logo; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/breach-seal.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] open state reads at 96px
- [x] shows five latches and no treasure, debris, or writing

## Torque Driver

- ID: `part-torque-driver`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/torque-driver.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a grounded mechanical gadget chassis for persistent Pick-focused workshop builds.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One low-profile blackened-steel torque driver with a broad aged-brass flywheel and two sturdy feet. Reusable parts: one compact low-profile torque driver with a wide brass flywheel and sturdy blackened-steel feet.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: momentum. The weighty flywheel makes stored mechanical force feel ready to release.
Restraint: Useful bench equipment, not a drill, gun, or vehicle part.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; A torque driver represents persistent Pick pressure; it is a tool, not a weapon.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/torque-driver.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Echo Coil

- ID: `part-echo-coil`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/echo-coil.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a readable analog gadget chassis for signal-focused workshop builds.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One paired copper induction coil holding a single smoked-glass resonator with a faint blue reflection. Reusable parts: one paired induction coil with a suspended glass resonator and restrained blue reflection.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: insight. The suspended resonator suggests a signal caught between two precise coils.
Restraint: Analog instrumentation, not magic, electricity, or a digital display.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; An echo coil represents reading previous table signals, not supernatural magic.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/echo-coil.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Decoy Relay

- ID: `part-decoy-relay`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/decoy-relay.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a compact routing gadget for clever defensive workshop builds.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One branching blackened-steel relay with two blank ceramic routing caps and a restrained red enamel line. Reusable parts: one compact branching relay with two blank ceramic routing caps and a red enamel diversion line.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: mischief. A visible fork in the mechanism suggests pressure being sent down the wrong path.
Restraint: Clever misdirection without sparks, aggression, or weapon cues.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; A decoy relay redirects pressure; it is not a bomb or weapon.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/decoy-relay.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Counterweight

- ID: `part-counterweight`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/counterweight.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a balanced comeback gadget for workshop builds that favor trailing players.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One small aged-brass counterweight suspended on a short blackened-steel rail with a broad base. Reusable parts: one balanced brass counterweight mechanism on a short steel rail.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: comeback hope. The balanced mass promises stored assistance when pressure rises.
Restraint: Industrial mechanism, not a scale, coin, pendulum clock, or treasure.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; A counterweight helps a trailing operator recover; it is not currency or treasure.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/counterweight.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Quickset Clamp

- ID: `part-quickset-clamp`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/quickset-clamp.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a precise spring-loaded gadget for fast-start workshop builds.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact blackened-steel clamp with exactly two padded brass jaws and one visible coiled spring. Reusable parts: one compact precision clamp with two padded jaws and a coiled tension spring.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: readiness. The poised jaws make the first move feel prepared and immediate.
Restraint: A precision tool, not a trap or weapon.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; A quickset clamp supports a fast opening attempt; it is a tool, not a trap.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/quickset-clamp.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Cache Siphon

- ID: `part-cache-siphon`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/cache-siphon.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a compact collection gadget for workshop builds centered on recovered material.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One small brass salvage intake with a single dark-glass reservoir and one neatly coiled braided hose. Reusable parts: one small salvage intake with a glass reservoir and braided intake hose.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: discovery. The visible reservoir makes recovered material feel tangible and useful.
Restraint: Workshop equipment, not a vacuum, weapon, or treasure container.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; A cache siphon recovers workshop material; it does not steal real currency.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/cache-siphon.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Route Compass

- ID: `part-route-compass`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/route-compass.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create an analog planning gadget for flexible workshop builds.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact three-way route selector assembly with exactly three broad unmarked brass vanes around one blank dark-glass center. Reusable parts: one compact mechanical route compass with three unmarked brass vanes around a dark glass center.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: foresight. Three poised vanes imply several routes without pretending to show a map.
Restraint: Mechanical planning tool, not a magical compass or generated interface.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; A route compass suggests tactical planning without a generated map or display.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/route-compass.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Brass Cogs

- ID: `part-brass-cogs`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/brass-cogs.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create an unmistakable small bundle of reusable mechanical crafting stock.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One tidy interlocking stack of exactly three thick aged-brass gear blanks with empty center bores. Reusable parts: one tidy stack of three interlocking aged-brass gear blanks.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: tactile collection. A satisfying nested stack makes basic salvage feel useful.
Restraint: Raw workshop stock, never currency or treasure.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; Brass cogs are crafting stock, not coins or treasure.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/brass-cogs.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Cipher Glass

- ID: `part-cipher-glass`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/cipher-glass.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a distinctive optical crafting component for signal-oriented blueprints.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One faceted smoked-green optical glass insert held in a small protective brass cradle. Reusable parts: one faceted piece of smoked green optical glass held in a small brass cradle.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: curiosity. Subsurface green light hints at useful information inside the material.
Restraint: Optical component, not a gemstone, jewel, or magical crystal.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; Cipher glass is a precision optical component, not a gem or currency.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background; gemstone; jewel; magic crystal
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/cipher-glass.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Flux Wire

- ID: `part-flux-wire`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/flux-wire.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a clean signal-wire component for modular gadget recipes.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One neat coil of insulated copper signal wire with exactly two blunt capped ends. Reusable parts: one neat coil of insulated copper signal wire with two blunt capped ends.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: preparedness. The tidy coil reads as versatile stock ready for assembly.
Restraint: Inert material with no spark, current, loose mess, or danger.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; Flux wire is inert crafting stock with no sparks or dangerous exposed current.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/flux-wire.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Tungsten Shard

- ID: `part-tungsten-shard`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/tungsten-shard.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a dense structural offcut for higher-grade workshop recipes.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One machined angular tungsten offcut with thick beveled edges and a matte gunmetal surface. Reusable parts: one machined angular tungsten offcut with beveled edges and a matte metallic finish.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: material value. Compact weight and clean machining make the offcut feel rare and useful.
Restraint: Industrial stock, not a blade, ingot, crystal, or precious object.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; The shard is an industrial offcut, not a blade, crystal, or precious gem.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background; blade; knife; gem; ingot
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/tungsten-shard.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Oxide Catalyst

- ID: `part-oxide-catalyst`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/oxide-catalyst.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a protected green catalyst component for specialist workshop recipes.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One sealed squat glass ampoule of muted green oxide catalyst inside a protective aged-brass cage. Reusable parts: one sealed squat glass ampoule of muted green oxide catalyst inside a protective brass cage.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: experimentation. The protected liquid adds a rare alchemical note to a grounded workshop.
Restraint: Industrial material, not a potion, medicine, or drink.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; The catalyst is workshop material, never a potion, medicine, or consumable drink.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background; potion; medicine; drink; magic glow
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/oxide-catalyst.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues

## Vault Resin

- ID: `part-vault-resin`
- Family: `transparent-part`
- Status: `accepted`
- Intended source: `assets/art-source/parts/inventory/vault-resin.png`

```text
Use case: stylized-concept
Asset type: transparent-background modular game-art cutout
Primary request: Create a durable bonding material canister for reinforced workshop builds.
Input images: Image 1: assets/art-source/scenes/plundrix-vault-hero.png - identity and architectural scale reference; Image 2: assets/art-source/scenes/replay-sabotage.png - material, wear, and close-detail reference
Scene/backdrop: Transparent canvas.
Subject: One compact sealed black ceramic resin canister with one narrow amber-glass level window. Reusable parts: one compact sealed black ceramic resin canister with an amber glass level window.
Style/medium: Premium painterly 3D game art with physically grounded industrial realism and crisp, readable silhouettes.
Composition/framing: One centered collectible object in front three-quarter view, complete silhouette, sturdy contact point, 14 percent transparent padding. Single centered object, complete silhouette, generous transparent padding, consistent three-quarter view.
Lighting/mood: Neutral studio key with warm amber edge light and one restrained semantic accent. Tactile, collectible, and immediately legible.
Color palette: near-black steel #0A0A0F; vault-panel indigo #1A1A2E; oxidized brass #C4956A; warm victory brass #E8B078; restrained blueprint blue #3A7CC4; restrained sabotage red #F06A6A; sparingly used search green #40A080
Materials/textures: blackened steel; aged and oxidized brass; worn enamel; machined calibration grooves without glyphs; braided cable; smoked glass
Joy target: resourcefulness. The sealed canister suggests a scarce material saved for a worthy build.
Restraint: Unlabeled industrial stock, not a drink, explosive, or fuel can.
Constraints: one unmistakable focal beat; clear depth separation when the asset contains a scene; readable at thumbnail size; leave live UI copy and controls to HTML; no text, letters, numbers, logos, watermark, border, cards, screens, or fake interface; no cryptocurrency symbols, coins, piles of treasure, guns, gore, explosions, or generic cyberpunk clutter; genuinely transparent background; no cast shadow outside the object footprint; no scene dressing; one object only; readable at 64px; blank manufactured surfaces; Vault resin is an industrial bonding material with no hazard symbols or writing.
Avoid: text; letters; numbers; symbols; logo; screen; gauge; hand; person; face; weapon; coins; treasure; scene background; drink; explosive; fuel can
Output intent: 1024x1024 source master saved as assets/art-source/parts/inventory/vault-resin.png
```

Acceptance checks:

- [x] transparent corners have zero alpha
- [x] silhouette reads at 64px
- [x] contains no writing, face, weapon, or currency cues
