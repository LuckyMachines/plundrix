import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(appDir, 'audio', 'manifest.json'), 'utf8'));
const outputDir = resolve(appDir, 'public', 'audio', 'sfx');

await mkdir(outputDir, { recursive: true });

function cueStem(cue) {
  return cue.replaceAll('.', '-');
}

function runFfmpeg(args, label) {
  const result = spawnSync('ffmpeg', args, {
    cwd: appDir,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Could not render ${label}:\n${result.stderr || result.stdout}`);
  }
}

for (const [cue, recipe] of Object.entries(manifest.cues)) {
  const inputArgs = [];
  const layerFilters = [];
  recipe.layers.forEach((layer, index) => {
    const source = manifest.sources[layer.source];
    if (!source) throw new Error(`${cue} references unknown source ${layer.source}`);
    inputArgs.push('-i', resolve(appDir, 'audio', source.file));
    const filters = [
      `atrim=start=0:end=${recipe.duration}`,
      'asetpts=PTS-STARTPTS',
      `highpass=f=${layer.highpass || 40}`,
      `lowpass=f=${layer.lowpass || 12000}`,
      `volume=${layer.gain ?? 1}`,
    ];
    if (layer.startMs) filters.push(`adelay=${layer.startMs}:all=1`);
    layerFilters.push(`[${index}:a]${filters.join(',')}[layer${index}]`);
  });

  for (const [variantIndex, ratio] of manifest.target.pitchVariants.entries()) {
    const fadeStart = Math.max(0.05, recipe.duration - 0.08);
    const mixInputs = recipe.layers.map((_, index) => `[layer${index}]`).join('');
    const filter = [
      ...layerFilters,
      `${mixInputs}amix=inputs=${recipe.layers.length}:normalize=0:dropout_transition=0,` +
        `asetrate=${manifest.target.sampleRate}*${ratio},aresample=${manifest.target.sampleRate},` +
        `atrim=start=0:end=${recipe.duration},afade=t=out:st=${fadeStart}:d=0.08,` +
        `alimiter=limit=0.92,loudnorm=I=${manifest.target.integratedLufs}:TP=${manifest.target.truePeakDb}:LRA=5[out]`,
    ].join(';');
    const output = resolve(outputDir, `${cueStem(cue)}-${variantIndex + 1}.mp3`);
    runFfmpeg([
      '-hide_banner', '-loglevel', 'error', '-y',
      ...inputArgs,
      '-filter_complex', filter,
      '-map', '[out]',
      '-ac', String(manifest.target.channels),
      '-ar', String(manifest.target.sampleRate),
      '-codec:a', 'libmp3lame',
      '-b:a', manifest.target.bitrate,
      output,
    ], `${cue} variation ${variantIndex + 1}`);
  }
}

const library = {
  schemaVersion: 1,
  id: manifest.id,
  version: manifest.version,
  license: manifest.license,
  target: manifest.target,
  variations: manifest.target.pitchVariants.map((ratio, index) => ({ index: index + 1, pitchRatio: ratio })),
  cues: Object.entries(manifest.cues).map(([id, recipe]) => ({
    id,
    label: id.split('.').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    family: recipe.family,
    duration: recipe.duration,
    sampleGain: recipe.sampleGain,
    pan: recipe.pan,
    files: manifest.target.pitchVariants.map((_, index) => `${cueStem(id)}-${index + 1}.mp3`),
  })),
};

await writeFile(resolve(outputDir, 'library.json'), `${JSON.stringify(library, null, 2)}\n`, 'utf8');
await writeFile(resolve(outputDir, 'library.js'), `window.PLUNDRIX_SOUND_LIBRARY = ${JSON.stringify(library)};\n`, 'utf8');
await copyFile(resolve(appDir, manifest.license.notice), resolve(appDir, 'public', 'audio', 'LICENSE-KENNEY-CC0.txt'));

console.log(`Plundrix sound library built: ${Object.keys(manifest.cues).length} cues / ${manifest.target.pitchVariants.length} variations / ${Object.keys(manifest.cues).length * manifest.target.pitchVariants.length} files + preview index`);
