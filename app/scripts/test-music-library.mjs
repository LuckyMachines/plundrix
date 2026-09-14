import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import manifest from '../audio/music-manifest.json' with { type: 'json' };

const appDir = resolve(process.cwd());
const outputDir = resolve(appDir, 'public', 'audio', 'music');

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.license.spdx, 'CC0-1.0');
assert.equal(manifest.license.commercialUse, true);
assert.equal(manifest.license.attributionRequired, false);
assert.match(manifest.source.commit, /^[a-f0-9]{40}$/);
assert.equal(manifest.target.integratedLufs, -24);
assert.equal(manifest.target.truePeakDb, -2);
assert.equal(manifest.target.sampleRate, 48000);
assert.equal(manifest.target.channels, 2);
assert.equal(manifest.tracks.length, 2);

for (const track of manifest.tracks) {
  assert.match(track.sourceSha256, /^[a-f0-9]{64}$/, `${track.id} needs a pinned source hash`);
  const output = resolve(outputDir, track.outputFile);
  assert.ok(existsSync(output), `Missing rendered track: ${output}`);
  assert.ok(statSync(output).size > 500_000, `Rendered track is unexpectedly small: ${output}`);
  const probe = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration',
    '-of', 'json',
    output,
  ], { cwd: appDir, encoding: 'utf8', windowsHide: true });
  assert.equal(probe.status, 0, `ffprobe failed for ${track.outputFile}: ${probe.stderr}`);
  const media = JSON.parse(probe.stdout);
  assert.equal(media.streams[0].codec_name, 'mp3');
  assert.equal(Number(media.streams[0].sample_rate), manifest.target.sampleRate);
  assert.equal(Number(media.streams[0].channels), manifest.target.channels);
  assert.ok(Math.abs(Number(media.format.duration) - track.duration) < 0.2, `${track.id} duration drifted`);
  const meter = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats',
    '-i', output,
    '-af', 'ebur128=framelog=verbose',
    '-f', 'null', 'NUL',
  ], { cwd: appDir, encoding: 'utf8', windowsHide: true });
  assert.equal(meter.status, 0, `Loudness analysis failed for ${track.outputFile}`);
  const readings = [...meter.stderr.matchAll(/I:\s*(-?\d+(?:\.\d+)?) LUFS/g)];
  const integratedLufs = Number(readings.at(-1)?.[1]);
  assert.ok(Number.isFinite(integratedLufs), `Could not read loudness for ${track.outputFile}`);
  assert.ok(Math.abs(integratedLufs - manifest.target.integratedLufs) <= 0.6, `${track.id} measured ${integratedLufs} LUFS`);
}

const libraryPath = resolve(outputDir, 'library.json');
const libraryScriptPath = resolve(outputDir, 'library.js');
const publicNoticePath = resolve(appDir, 'public', 'audio', 'LICENSE-BEATSCRIBE-CC0.txt');
assert.ok(existsSync(libraryPath), 'Missing generated music index');
assert.ok(existsSync(libraryScriptPath), 'Missing file-compatible music index');
assert.ok(existsSync(publicNoticePath), 'Missing public CC0 music license record');
const library = JSON.parse(readFileSync(libraryPath, 'utf8'));
assert.deepEqual(library.tracks.map((track) => track.outputFile), manifest.tracks.map((track) => track.outputFile));
assert.equal(library.source.commit, manifest.source.commit);
assert.match(readFileSync(publicNoticePath, 'utf8'), /Creative Commons Zero v?1\.0/i);

const bridge = readFileSync(resolve(appDir, 'src', 'components', 'shared', 'SessionMusicBridge.jsx'), 'utf8');
assert.match(bridge, /musicManifest/);
assert.match(bridge, /musicEnabled/);
assert.match(bridge, /musicVolume/);
assert.match(bridge, /data-audio-channel/);

const preview = readFileSync(resolve(appDir, 'public', 'audio-preview.html'), 'utf8');
assert.match(preview, /Background score/);
assert.match(preview, /PLUNDRIX_MUSIC_LIBRARY/);

console.log(`Music library passed: ${manifest.tracks.length} CC0 tracks / ${manifest.target.sampleRate / 1000} kHz stereo / ${manifest.target.integratedLufs} LUFS target`);
