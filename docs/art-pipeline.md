# Plundrix Art Pipeline

The art pipeline turns one visual language into repeatable scene masters, reusable transparent parts, optimized delivery files, and reviewable evidence. Its goal is not to maximize image count. Its goal is to create truthful moments of anticipation, agency, surprise, mastery, relief, and social drama without making the interface noisier.

## Source of truth

The pipeline has four deliberately separate modules:

- `app/art/direction.mjs` - the world promise, palette, materials, lighting, product truths, joy principles, and global quality gates.
- `app/art/parts.mjs` - reusable semantic pieces such as the vault, five-lock rack, operator station, Pick tool, Search kit, sabotage cable, and copy-safe field.
- `app/art/families.mjs` - composition rules for atmosphere, mode art, replay stories, social sources, and transparent parts.
- `app/art/assets.mjs` - individual briefs, lifecycle state, source path, delivery transforms, byte budgets, alt text, and acceptance checks.

The asset manifest is executable product documentation. The Design System reads the same records that the command-line pipeline validates, so the gallery cannot silently drift away from production.

## Lifecycle

Every asset uses one of four states:

1. `briefed` - the generation prompt and delivery contract are ready; a master may not exist yet.
2. `needs-revision` - a currently shipping asset is usable but fails a named visual or gameplay-truth gate.
3. `accepted` - the master passed the manual checks and every automated file gate.
4. `retired` - retained for provenance but excluded from normal builds and prompt packs.

Never promote an asset because it merely looks polished. It must communicate the intended player emotion, preserve the relevant game facts, survive its crop, and remain readable at its smallest use.

## Directory contract

```text
app/
  art/                         # art direction and executable recipes
  assets/
    art-source/scenes/         # archival scene masters; never shipped directly
    art-source/parts/          # generated transparent masters
    art-source/raw/            # preserved unkeyed model responses
    social-source/             # archival text-free social masters
  public/images/               # optimized delivery derivatives only
  reports/art-pipeline/        # prompt pack and hash-based inventory
```

Keeping masters outside `public/` prevents multi-megabyte generation files from entering the production bundle. Product code should reference only the manifest's `publicPath` values.

## Commands

Run these from `app/`:

```powershell
npm run art:validate
npm run art:generate -- --asset part-lock-module
npm run art:generate-batch -- --assets part-precision-kit,part-signal-scanner,part-firewall
npm run art:compose -- --asset instant-breach --base instant-breach-base-flux2-pro-v1.png
npm run art:promote -- --asset part-lock-module --candidate part-lock-module-flux2-pro-v1.png
npm run art:prompts
npm run art:build -- --dry-run
npm run art:build
npm run art:inventory
npm run test:art
```

- `art:validate` checks manifest integrity, paths, source/output dimensions, byte budgets, and accepted-file presence.
- `art:generate -- --asset <id>` sends exactly one text-only brief to the approved `~/.codex/flux2-pro-image.sh` Azure wrapper, saves a versioned candidate under `assets/art-source/candidates/`, and records its prompt, model, dimensions, and hash without replacing the manifest source. Transparent-part requests use a magenta extraction matte, preserve the raw response, and create a separately reviewable alpha PNG.
- `art:generate-batch -- --assets <id,id,...>` generates a reviewed queue sequentially and relies on the approved wrapper's four-request-per-minute throttle. It never promotes or overwrites source masters.
- `art:compose -- --asset <id> --base <filename>` applies a declared reusable-part recipe to an already generated scene base. This is the preferred solution for exact repeated counts: the Instant Play scene places the accepted lock module five times instead of asking the model to count.
- `art:promote -- --asset <id> --candidate <filename>` moves one reviewed candidate to its canonical source path, archives the unkeyed matte response under `assets/art-source/raw/`, and updates the provenance record. It refuses to overwrite an existing source.
- `art:prompts` composes the global direction, family rules, reusable parts, asset brief, joy target, constraints, and avoid list into Markdown and JSON packs.
- `art:build` uses FFmpeg to produce declared WebP/JPEG derivatives and deterministic social-card typography. Use `--asset <id>` or `--family <id>` for a narrow build.
- `art:inventory` records exact dimensions, sizes, pixel formats, and SHA-256 hashes.
- `test:art` guards the manifest contract and verifies every materialized asset.
- `art:all` runs prompt compilation, the accepted/shipping build, validation, and inventory in sequence.

FFmpeg must be on `PATH` for derivative builds. Flux transparent-part generation also requires Python 3 and Pillow for magenta-family matte extraction; the extractor validates plausible transparent and opaque coverage. Validation reads PNG, JPEG, and WebP metadata directly, so ordinary application builds do not depend on FFmpeg, FFprobe, Python, or Pillow. Background child processes are launched with `windowsHide: true`.

## Generate one asset

1. Add or refine its record in `app/art/assets.mjs`; start it as `briefed`.
2. Run `npm run art:prompts -- --asset <id>` when you want the portable reference-aware brief. For the approved text-only Azure path, run `npm run art:generate -- --asset <id>`.
3. Generate exactly one asset per provider request. The batch command schedules those requests sequentially through the wrapper's rate limit. The Flux command uses the complete text description while the portable prompt pack also names the identity and material references for tools that accept image inputs. For transparent parts, verify real alpha after generation. Do not ask the image model to render interface copy.
4. Promote the selected candidate with `npm run art:promote -- --asset <id> --candidate <filename>`. Never overwrite an accepted master during exploration; generation always creates a versioned candidate and promotion refuses an occupied source path.
5. Mark the reviewed manifest entry accepted, then run `npm run art:build -- --asset <id>`.
6. Review at original size, at 240px thumbnail size, and inside the real desktop/mobile crop.
7. Complete every manual check. Record a precise `reviewNote` and use `needs-revision` when a current image fails a gate.
8. Change the state to `accepted`, then run `npm run art:all` and the relevant browser test.

The approved generation path is Azure FLUX.2-pro through the local wrapper, one call per distinct asset. The pipeline is provider-agnostic after generation: the accepted master, raw response, prompt record, manifest, derivative, and inventory are the durable artifacts.

## Joy gate

Before acceptance, reviewers answer five concrete questions:

| Dimension | Pass condition |
| --- | --- |
| Promise | The image communicates its player-facing job before explanatory copy is read. |
| Agency | A player can trace the depicted cause to Pick, Search, Sabotage, or vault progress. |
| Delight | One memorable detail rewards attention without becoming clutter. |
| Restraint | The image stops before spectacle obscures mechanics or interface hierarchy. |
| Legibility | Subject, state, and silhouette survive the smallest intended crop. |

An image that misses any product-truth requirement cannot receive `accepted`, regardless of its aesthetic quality.

## Current queue

- Thirty-four shipping assets are accepted and under manifest and delivery-budget control.
- Instant Play now uses a generated lock-free room plus exactly five deterministic instances of the accepted lock module. Its earlier seven-lock master remains archived under `assets/art-source/retired/`.
- Twenty-four reusable transparent parts are accepted: the original action kit, the initial gadget and rival sets, seven modular gadget chassis, and six crafting materials. Their original matte responses, keyed masters, generation prompts, hashes, and delivery derivatives remain traceable.
- The generated victory scene, gadget set, and rival devices are integrated into setup, active play, Instant final briefing, onchain final briefing, and the Design System inventory.
- The modular workshop uses seven new chassis and six new material masters plus the code-rendered `GadgetVisual` finish, material-pattern, calibration-glyph, and rarity layers. This makes all 1,200 deterministic configurations visually identifiable without shipping 1,200 redundant raster files.
