import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../audio/manifest.json' with { type: 'json' };

const appDir = resolve(process.cwd());
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.license.spdx, 'CC0-1.0');
assert.equal(manifest.license.commercialUse, true);
assert.equal(manifest.target.integratedLufs, -18);
assert.equal(manifest.target.truePeakDb, -1.5);
assert.equal(manifest.target.pitchVariants.length, 3);
assert.ok(Object.keys(manifest.cues).length >= 21);

for (const [id, source] of Object.entries(manifest.sources)) {
  assert.ok(manifest.packs[source.pack], `${id} references an unknown source pack`);
  assert.ok(existsSync(resolve(appDir, 'audio', source.file)), `Missing source audio: ${source.file}`);
}

for (const [cue, recipe] of Object.entries(manifest.cues)) {
  assert.ok(recipe.layers.length >= 1, `${cue} needs at least one layer`);
  assert.ok(recipe.layers.every((layer) => manifest.sources[layer.source]), `${cue} has an unknown layer source`);
  for (let index = 1; index <= manifest.target.pitchVariants.length; index += 1) {
    const path = resolve(appDir, 'public', 'audio', 'sfx', `${cue.replaceAll('.', '-')}-${index}.mp3`);
    assert.ok(existsSync(path), `Missing rendered cue: ${path}`);
    assert.ok(statSync(path).size > 1000, `Rendered cue is unexpectedly small: ${path}`);
  }
}

const notice = readFileSync(resolve(appDir, manifest.license.notice), 'utf8');
assert.match(notice, /Creative Commons Zero 1\.0/i);
assert.match(notice, /commercial/i);
const bridge = readFileSync(resolve(appDir, 'src/components/shared/SessionAudioBridge.jsx'), 'utf8');
assert.match(bridge, /audioManifest/);
assert.match(bridge, /decodeAudioData/);
const previewPath = resolve(appDir, 'public', 'audio-preview.html');
const libraryPath = resolve(appDir, 'public', 'audio', 'sfx', 'library.json');
const libraryScriptPath = resolve(appDir, 'public', 'audio', 'sfx', 'library.js');
assert.ok(existsSync(previewPath), 'Missing standalone sound preview page');
assert.ok(existsSync(libraryPath), 'Missing generated sound preview index');
assert.ok(existsSync(libraryScriptPath), 'Missing file-compatible sound preview index');
const preview = readFileSync(previewPath, 'utf8');
const library = JSON.parse(readFileSync(libraryPath, 'utf8'));
assert.equal(library.cues.length, Object.keys(manifest.cues).length);
assert.equal(library.variations.length, manifest.target.pitchVariants.length);
assert.ok(library.cues.every((cue) => cue.files.length === manifest.target.pitchVariants.length));
assert.match(preview, /Plundrix Sound Locker/);
assert.match(preview, /Play visible/);
assert.match(preview, /library\.js/);
assert.ok(existsSync(resolve(appDir, 'public', 'audio', 'LICENSE-KENNEY-CC0.txt')), 'Missing public CC0 license record');

console.log(`Sound library passed: ${Object.keys(manifest.sources).length} CC0 sources / ${Object.keys(manifest.cues).length} composite cues / ${Object.keys(manifest.cues).length * manifest.target.pitchVariants.length} rendered variations`);
