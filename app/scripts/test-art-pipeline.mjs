import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ART_ASSETS,
  ART_DIRECTION,
  ART_FAMILIES_BY_ID,
  ART_PARTS_BY_ID,
} from '../art/index.mjs';
import {
  composePrompt,
  inspectAssetFiles,
  validateDefinitions,
} from './lib/art-pipeline-core.mjs';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const definitionErrors = validateDefinitions({
  assets: ART_ASSETS,
  direction: ART_DIRECTION,
  familiesById: ART_FAMILIES_BY_ID,
  partsById: ART_PARTS_BY_ID,
});
assert.deepEqual(definitionErrors, [], definitionErrors.join('\n'));

for (const asset of ART_ASSETS) {
  const prompt = composePrompt(asset, {
    direction: ART_DIRECTION,
    familiesById: ART_FAMILIES_BY_ID,
    partsById: ART_PARTS_BY_ID,
  });
  assert.match(prompt, /^Use case: /, `${asset.id} prompt should use the shared image-generation schema`);
  assert.match(prompt, /Joy target:/, `${asset.id} prompt should declare its emotional job`);
  assert.match(prompt, /no text, letters, numbers, logos, watermark/i, `${asset.id} prompt should preserve UI separation`);
}

const transparentParts = ART_ASSETS.filter((asset) => asset.family === 'transparent-part');
assert.ok(transparentParts.length >= 4, 'the system should include a practical reusable part kit');
for (const asset of transparentParts) {
  assert.equal(asset.status, 'accepted', `${asset.id} should retain its reviewed source and delivery derivative`);
  assert.equal(asset.generation.model, 'FLUX.2-pro', `${asset.id} should retain model provenance`);
  assert.match(composePrompt(asset, { direction: ART_DIRECTION, familiesById: ART_FAMILIES_BY_ID, partsById: ART_PARTS_BY_ID }), /genuinely transparent background/i);
}

const instantBreach = ART_ASSETS.find((asset) => asset.id === 'instant-breach');
assert.equal(instantBreach.status, 'accepted');
assert.equal(instantBreach.composite.expectedCount, 5);
assert.equal(instantBreach.composite.positions.length, 5, 'Instant art must deterministically place exactly five locks');
assert.equal(new Set(instantBreach.composite.positions.map((position) => position.join(','))).size, 5, 'lock placements must be unique');
assert.equal(instantBreach.composite.part, 'assets/art-source/parts/lock-module.png');

const socialAssets = ART_ASSETS.filter((asset) => asset.family === 'social-source');
assert.equal(socialAssets.length, 3, 'three social card recipes should remain available');
assert.ok(socialAssets.every((asset) => asset.outputs[0].copy.headline.length === 2));

const fileInspection = inspectAssetFiles({ appDir, assets: ART_ASSETS });
assert.deepEqual(fileInspection.errors, [], fileInspection.errors.join('\n'));
assert.equal(
  fileInspection.inventory.filter((asset) => ['accepted', 'needs-revision'].includes(asset.status)).length,
  ART_ASSETS.length,
  'every registered asset should have reached a reviewed lifecycle state',
);
assert.equal(ART_ASSETS.filter((asset) => asset.status === 'needs-revision').length, 0, 'no accepted asset should retain an unresolved visual-truth failure');

console.log(`Art pipeline tests passed for ${ART_ASSETS.length} assets and ${transparentParts.length} accepted reusable parts.`);
