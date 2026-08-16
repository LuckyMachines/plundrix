import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(appDir, 'public', 'images', 'og');
const font = 'C\\:/Windows/Fonts/bahnschrift.ttf';

const cards = [
  {
    source: 'assets/social-source/plundrix-home-gpt-image-2.png',
    output: 'plundrix-home.jpg',
    eyebrow: 'PLUNDRIX',
    headline: ['CRACK THE VAULT.', 'BREAK THE TABLE.'],
    footer: 'PICK / SEARCH / SABOTAGE',
  },
  {
    source: 'assets/social-source/plundrix-play-gpt-image-2.png',
    output: 'plundrix-play.jpg',
    eyebrow: 'INSTANT PLAY',
    headline: ['YOUR TABLE', 'IS READY.'],
    footer: 'NO WALLET REQUIRED',
  },
  {
    source: 'assets/social-source/plundrix-trailer-gpt-image-2.png',
    output: 'plundrix-trailer.jpg',
    eyebrow: 'GAMEPLAY TRAILER',
    headline: ['ONE VAULT.', 'NO SAFE TURN.'],
    footer: 'FOUR OPERATORS / FIVE LOCKS',
  },
];

function drawText(text, size, y, color = '0xf5f1eb') {
  return `drawtext=fontfile='${font}':text='${text}':fontcolor=${color}:fontsize=${size}:x=70:y=${y}`;
}

mkdirSync(outputDir, { recursive: true });

for (const card of cards) {
  const source = resolve(appDir, card.source);
  const output = resolve(outputDir, card.output);
  const filter = [
    'scale=1200:630:force_original_aspect_ratio=increase',
    'crop=1200:630',
    'eq=brightness=-0.1:saturation=0.92',
    'drawbox=x=0:y=0:w=760:h=630:color=0x08090d@0.78:t=fill',
    drawText(card.eyebrow, 34, 62, '0xe8b078'),
    drawText(card.headline[0], 78, 180),
    drawText(card.headline[1], 78, 266),
    'drawbox=x=70:y=430:w=88:h=3:color=0xe8b078@1:t=fill',
    drawText(card.footer, 28, 472, '0xb9b7c6'),
  ].join(',');

  const result = spawnSync('ffmpeg', [
    '-y',
    '-v', 'error',
    '-i', source,
    '-vf', filter,
    '-frames:v', '1',
    '-q:v', '2',
    output,
  ], { stdio: 'inherit', windowsHide: true });

  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Built ${cards.length} social cards in ${outputDir}`);
