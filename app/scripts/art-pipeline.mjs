import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ART_ASSETS,
  ART_DIRECTION,
  ART_FAMILIES_BY_ID,
  ART_PARTS_BY_ID,
  ART_SYSTEM_VERSION,
} from '../art/index.mjs';
import {
  buildAssets,
  composeCandidateFromBase,
  generateFluxCandidate,
  inspectAssetFiles,
  promoteCandidate,
  selectAssets,
  validateDefinitions,
  writeInventory,
  writePromptPack,
} from './lib/art-pipeline-core.mjs';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'help', ...args] = process.argv.slice(2);
const options = {
  assetId: optionValue(args, '--asset'),
  assetIds: optionValue(args, '--assets')?.split(',').map((value) => value.trim()).filter(Boolean),
  candidate: optionValue(args, '--candidate'),
  base: optionValue(args, '--base'),
  familyId: optionValue(args, '--family'),
  includeRetired: args.includes('--include-retired'),
};
const selected = selectAssets(ART_ASSETS, options);
const selectionLabel = options.assetId || (options.familyId ? `family-${options.familyId}` : null);

if (options.assetId && selected.length === 0) fail(`Unknown asset: ${options.assetId}`);
if (options.familyId && selected.length === 0) fail(`Unknown or empty family: ${options.familyId}`);

switch (command) {
  case 'generate': {
    validateDefinitionsOrExit();
    if (!options.assetId) fail('generate requires --asset <id>; distinct assets must be generated one request at a time.');
    if (selected.length !== 1) fail(`Unable to resolve one asset for ${options.assetId}.`);
    const result = generateFluxCandidate({
      appDir,
      asset: selected[0],
      direction: ART_DIRECTION,
      familiesById: ART_FAMILIES_BY_ID,
      partsById: ART_PARTS_BY_ID,
    });
    console.log(`Generated Flux.2-pro candidate:\n- image: ${result.imagePath}${result.rawImagePath ? `\n- preserved raw source: ${result.rawImagePath}` : ''}\n- provenance: ${result.recordPath}\n- dimensions: ${result.dimensions.width}x${result.dimensions.height}\nReview and promote manually; the source manifest was not overwritten.`);
    break;
  }
  case 'generate-batch': {
    validateDefinitionsOrExit();
    if (!options.assetIds?.length) fail('generate-batch requires --assets <id,id,...>.');
    const batch = options.assetIds.map((id) => {
      const asset = ART_ASSETS.find((item) => item.id === id);
      if (!asset) fail(`Unknown asset: ${id}`);
      return asset;
    });
    for (const asset of batch) {
      const result = generateFluxCandidate({
        appDir,
        asset,
        direction: ART_DIRECTION,
        familiesById: ART_FAMILIES_BY_ID,
        partsById: ART_PARTS_BY_ID,
      });
      console.log(`${asset.id}: ${result.imagePath}${result.rawImagePath ? ` (raw: ${result.rawImagePath})` : ''}`);
    }
    console.log(`Generated ${batch.length} versioned candidates. Review each before promotion.`);
    break;
  }
  case 'promote': {
    validateDefinitionsOrExit();
    if (!options.assetId || !options.candidate) fail('promote requires --asset <id> --candidate <filename>.');
    if (selected.length !== 1) fail(`Unable to resolve one asset for ${options.assetId}.`);
    const result = promoteCandidate({ appDir, asset: selected[0], candidate: options.candidate });
    console.log(`Promoted reviewed candidate:\n- source: ${result.sourcePath}${result.rawSourcePath ? `\n- preserved raw source: ${result.rawSourcePath}` : ''}\n- provenance: ${result.recordPath}\nUpdate the manifest lifecycle after completing its manual checks.`);
    break;
  }
  case 'compose': {
    validateDefinitionsOrExit();
    if (!options.assetId || !options.base) fail('compose requires --asset <id> --base <filename>.');
    if (selected.length !== 1) fail(`Unable to resolve one asset for ${options.assetId}.`);
    const result = composeCandidateFromBase({ appDir, asset: selected[0], base: options.base });
    console.log(`Composed deterministic candidate:\n- image: ${result.imagePath}\n- preserved scene base: ${result.rawImagePath}\n- provenance: ${result.recordPath}\n- dimensions: ${result.dimensions.width}x${result.dimensions.height}`);
    break;
  }
  case 'validate':
    validate(selected);
    break;
  case 'prompts': {
    validateDefinitionsOrExit();
    const paths = writePromptPack({
      appDir,
      assets: selected,
      direction: ART_DIRECTION,
      familiesById: ART_FAMILIES_BY_ID,
      partsById: ART_PARTS_BY_ID,
      version: ART_SYSTEM_VERSION,
      reportStem: selectionLabel ? `prompt-${selectionLabel}` : 'prompt-pack',
    });
    console.log(`Wrote ${selected.length} generation briefs:\n- ${paths.join('\n- ')}`);
    break;
  }
  case 'build': {
    validateDefinitionsOrExit();
    const buildable = args.includes('--include-briefed') ? selected : selected.filter((asset) => ['accepted', 'needs-revision'].includes(asset.status));
    const result = buildAssets({ appDir, assets: buildable, dryRun: args.includes('--dry-run') });
    console.log(result.built.length ? result.built.join('\n') : 'No assets were built.');
    if (result.skipped.length) console.log(`Skipped:\n- ${result.skipped.join('\n- ')}`);
    if (args.includes('--include-briefed') && result.skipped.length) fail('One or more requested sources have not been generated.');
    if (!args.includes('--dry-run')) validate(selected);
    break;
  }
  case 'inventory': {
    validateDefinitionsOrExit();
    const result = inspectAssetFiles({ appDir, assets: selected });
    if (result.errors.length) fail(result.errors.join('\n'));
    const paths = writeInventory({ appDir, assets: selected, inventory: result.inventory, version: ART_SYSTEM_VERSION, reportStem: selectionLabel ? `inventory-${selectionLabel}` : 'inventory' });
    console.log(`Wrote art inventory:\n- ${paths.join('\n- ')}`);
    break;
  }
  case 'all': {
    validateDefinitionsOrExit();
    writePromptPack({ appDir, assets: selected, direction: ART_DIRECTION, familiesById: ART_FAMILIES_BY_ID, partsById: ART_PARTS_BY_ID, version: ART_SYSTEM_VERSION, reportStem: selectionLabel ? `prompt-${selectionLabel}` : 'prompt-pack' });
    const buildable = selected.filter((asset) => ['accepted', 'needs-revision'].includes(asset.status));
    const result = buildAssets({ appDir, assets: buildable, dryRun: args.includes('--dry-run') });
    console.log(result.built.length ? result.built.join('\n') : 'No assets were built.');
    validate(selected, true, selectionLabel ? `inventory-${selectionLabel}` : 'inventory');
    break;
  }
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    fail(`Unknown art pipeline command: ${command}\n\n${helpText()}`);
}

function validate(assets, writeReport = false, reportStem = 'inventory') {
  validateDefinitionsOrExit();
  const result = inspectAssetFiles({ appDir, assets });
  if (result.errors.length) fail(result.errors.join('\n'));
  if (writeReport) {
    writeInventory({ appDir, assets, inventory: result.inventory, version: ART_SYSTEM_VERSION, reportStem });
  }
  const accepted = assets.filter((asset) => asset.status === 'accepted').length;
  const needsRevision = assets.filter((asset) => asset.status === 'needs-revision').length;
  const briefed = assets.filter((asset) => asset.status === 'briefed').length;
  console.log(`Art pipeline valid: ${accepted} accepted assets, ${needsRevision} needs revision, ${briefed} generation-ready briefs, system ${ART_SYSTEM_VERSION}.`);
}

function validateDefinitionsOrExit() {
  const errors = validateDefinitions({
    assets: ART_ASSETS,
    direction: ART_DIRECTION,
    familiesById: ART_FAMILIES_BY_ID,
    partsById: ART_PARTS_BY_ID,
  });
  if (errors.length) fail(errors.join('\n'));
}

function optionValue(values, name) {
  const index = values.indexOf(name);
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) fail(`${name} requires a value.`);
  return value;
}

function helpText() {
  return [
    'Plundrix art pipeline',
    '',
    'Commands:',
    '  generate --asset <id>             Generate one versioned candidate through ~/.codex Flux.2-pro.',
    '  generate-batch --assets <ids>      Generate distinct comma-separated assets sequentially with rate limiting.',
    '  promote --asset <id> --candidate  Move one reviewed candidate into its canonical source path.',
    '  compose --asset <id> --base       Apply a declared part recipe to an existing generated base.',
    '  validate                         Validate manifests, masters, derivatives, dimensions, and byte budgets.',
    '  prompts                          Compile generation-ready Markdown and JSON prompt packs.',
    '  build                            Build accepted delivery derivatives from archival masters.',
    '  inventory                        Write a hash-based Markdown and JSON asset inventory.',
    '  all                              Compile prompts, build accepted assets, validate, and inventory.',
    '',
    'Filters:',
    '  --asset <id>                     Process one asset.',
    '  --assets <id,id,...>              Select distinct assets for generate-batch.',
    '  --family <id>                    Process one family.',
    '  --include-briefed                 Attempt builds for assets awaiting generation.',
    '  --include-retired                 Include retired assets.',
    '  --dry-run                         Print build targets without writing derivatives.',
  ].join('\n');
}

function printHelp() {
  console.log(helpText());
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
