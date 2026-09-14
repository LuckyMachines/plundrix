import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(appDir, 'audio', 'music-manifest.json'), 'utf8'));
const cacheDir = resolve(tmpdir(), 'plundrix-music-source-cache', manifest.source.commit);
const outputDir = resolve(appDir, 'public', 'audio', 'music');

await mkdir(cacheDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function sourceFor(track) {
  const target = resolve(cacheDir, track.sourceFile.split('/').at(-1));
  if (existsSync(target)) {
    const cached = await readFile(target);
    if (hash(cached) === track.sourceSha256) return target;
  }
  const url = `https://raw.githubusercontent.com/Beatscribe/homebrew_vgm/${manifest.source.commit}/${track.sourceFile}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${track.sourceTitle}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const digest = hash(buffer);
  if (digest !== track.sourceSha256) throw new Error(`${track.sourceTitle} failed its pinned SHA-256 check: ${digest}`);
  await writeFile(target, buffer);
  return target;
}

function render(source, output, track) {
  const target = manifest.target;
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', source,
    '-af', `loudnorm=I=${target.integratedLufs}:TP=${target.truePeakDb}:LRA=${target.loudnessRange}`,
    '-ac', String(target.channels),
    '-ar', String(target.sampleRate),
    '-codec:a', 'libmp3lame',
    '-b:a', target.bitrate,
    output,
  ], { cwd: appDir, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`Could not render ${track.title}:\n${result.stderr || result.stdout}`);
}

for (const track of manifest.tracks) {
  const source = await sourceFor(track);
  render(source, resolve(outputDir, track.outputFile), track);
}

const library = {
  schemaVersion: manifest.schemaVersion,
  id: manifest.id,
  version: manifest.version,
  target: manifest.target,
  license: manifest.license,
  source: manifest.source,
  tracks: manifest.tracks.map(({ sourceSha256, sourceFile, ...track }) => ({
    ...track,
    sourceFile,
    sourceSha256,
  })),
};

await writeFile(resolve(outputDir, 'library.json'), `${JSON.stringify(library, null, 2)}\n`, 'utf8');
await writeFile(resolve(outputDir, 'library.js'), `window.PLUNDRIX_MUSIC_LIBRARY = ${JSON.stringify(library)};\n`, 'utf8');
await writeFile(resolve(appDir, 'public', 'audio', 'LICENSE-BEATSCRIBE-CC0.txt'), await readFile(resolve(appDir, manifest.license.notice), 'utf8'), 'utf8');

console.log(`Plundrix music library built: ${manifest.tracks.length} CC0 tracks / ${manifest.target.integratedLufs} LUFS / ${manifest.target.bitrate}`);
