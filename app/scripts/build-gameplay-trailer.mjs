import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenes = [
  'public/images/plundrix-vault-hero.png',
  'reports/visual-audit/a-plus/lobby-desktop.png',
  'reports/visual-audit/a-plus/active-desktop.png',
  'reports/visual-audit/a-plus/resolution-desktop.png',
  'public/images/replay-sabotage.png',
  'public/images/replay-comeback.png',
  'reports/visual-audit/a-plus/sepolia-funded-game-over-desktop.png',
  'public/images/replay-close-finish.png',
].map((file) => path.join(root, file));

const secondsPerScene = 4;
const inputs = scenes.flatMap((file) => ['-loop', '1', '-t', String(secondsPerScene), '-i', file]);
const filters = scenes.map((_, index) => (
  `[${index}:v]scale=1280:720:force_original_aspect_ratio=increase,` +
  'crop=1280:720,fps=30,' +
  `fade=t=in:st=0:d=0.4,fade=t=out:st=3.6:d=0.4,setpts=PTS-STARTPTS[v${index}]`
));
const concat = `${scenes.map((_, index) => `[v${index}]`).join('')}concat=n=${scenes.length}:v=1:a=0,format=yuv420p[out]`;
const filter = [...filters, concat].join(';');

function build(output, codecArgs) {
  const result = spawnSync('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex', filter,
    '-map', '[out]',
    '-an',
    ...codecArgs,
    '-movflags', '+faststart',
    path.join(root, 'public', 'video', output),
  ], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

build('plundrix-gameplay-trailer.mp4', ['-c:v', 'libx264', '-preset', 'fast', '-crf', '25']);
