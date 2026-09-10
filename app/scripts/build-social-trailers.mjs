import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(appDir, 'exports', 'trailers');
const secondsPerScene = 3;
const fps = 24;

const copy = [
  ['PLUNDRIX', 'ONE VAULT. NO SAFE TURN.'],
  ['PICK. SEARCH. SABOTAGE.', 'EVERY MOVE REVEALS TOGETHER.'],
  ['STEAL THE TOOLS.', 'BREAK THE PLAN.'],
  ['FALL BEHIND?', 'TABLE PRESSURE BITES BACK.'],
  ['10 SIGNATURE GADGETS', '1,200 BUILDS. CHOOSE YOUR TROUBLE.'],
  ['THREE VAULTS. TWO LIVES.', 'KEEP THE CONTRABAND.'],
  ['EVERY HEIST LEAVES A REPLAY.', 'LEARN IT. SHARE IT. RUN IT BACK.'],
  ['FREE-PLAY BETA', 'PLAY NOW AT GAME.PLUNDRIX.COM'],
];

const variants = [
  {
    name: 'plundrix-trailer-landscape-2026-09',
    width: 1280,
    height: 720,
    titleSize: 62,
    detailSize: 26,
    marginV: 72,
    scenes: [
      'assets/art-source/scenes/plundrix-vault-hero.png',
      'reports/art-expansion-v2/actual/instant-active-desktop.png',
      'assets/art-source/scenes/replay-sabotage.png',
      'assets/art-source/scenes/replay-comeback.png',
      'reports/art-expansion-v2/actual/design-system-assets-desktop.png',
      'reports/art-expansion-v2/actual/instant-setup-desktop.png',
      'assets/art-source/scenes/replay-close-finish.png',
      'assets/art-source/scenes/victory-breach.png',
    ],
  },
  {
    name: 'plundrix-trailer-vertical-2026-09',
    width: 720,
    height: 1280,
    titleSize: 66,
    detailSize: 27,
    marginV: 132,
    scenes: [
      'assets/art-source/scenes/plundrix-vault-hero.png',
      'reports/art-expansion-v2/actual/instant-active-mobile.png',
      'assets/art-source/scenes/replay-sabotage.png',
      'assets/art-source/scenes/replay-comeback.png',
      'reports/art-expansion-v2/actual/design-system-assets-desktop.png',
      'reports/art-expansion-v2/actual/instant-setup-mobile.png',
      'assets/art-source/scenes/replay-close-finish.png',
      'assets/art-source/scenes/victory-breach.png',
    ],
  },
];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: appDir,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function assTime(seconds) {
  const whole = Math.floor(seconds);
  const centiseconds = Math.round((seconds - whole) * 100);
  return `0:00:${String(whole).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function subtitleFile(variant) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${variant.width}
PlayResY: ${variant.height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Trailer,Bahnschrift,${variant.titleSize},&H00FFFFFF,&H00FFFFFF,&HC8000000,&HA0000000,-1,0,0,0,100,100,1,0,1,3,0,2,48,48,${variant.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
  const events = copy.map(([title, detail], index) => {
    const start = index * secondsPerScene;
    const end = start + secondsPerScene;
    const titleSize = variant.width < 800 && title.length > 25 ? 44 : variant.titleSize;
    const text = `{\\fad(180,220)\\b1\\fs${titleSize}\\c&H0078B0E8&}${title}\\N{\\fs${variant.detailSize}\\c&H0080A040&\\fsp3}${detail}`;
    return `Dialogue: 0,${assTime(start)},${assTime(end)},Trailer,,0,0,0,,${text}`;
  });
  return `${header}\n${events.join('\n')}\n`;
}

function buildVariant(variant) {
  for (const source of variant.scenes) {
    if (!existsSync(resolve(appDir, source))) throw new Error(`Missing trailer source: ${source}`);
  }

  const assName = `${variant.name}.ass`;
  const outputName = `${variant.name}.mp4`;
  const contactName = `${variant.name}-contact-sheet.jpg`;
  const assPath = resolve(outputDir, assName);
  const outputPath = resolve(outputDir, outputName);
  const contactPath = resolve(outputDir, contactName);
  writeFileSync(assPath, subtitleFile(variant), 'utf8');

  const inputs = variant.scenes.flatMap((source) => [
    '-loop', '1',
    '-framerate', String(fps),
    '-t', String(secondsPerScene),
    '-i', resolve(appDir, source),
  ]);
  inputs.push(
    '-f', 'lavfi', '-t', String(copy.length * secondsPerScene), '-i', 'sine=frequency=55:sample_rate=48000',
    '-f', 'lavfi', '-t', String(copy.length * secondsPerScene), '-i', 'sine=frequency=110:sample_rate=48000',
    '-f', 'lavfi', '-t', String(copy.length * secondsPerScene), '-i', 'anoisesrc=color=pink:amplitude=0.04:sample_rate=48000',
  );

  const frames = secondsPerScene * fps;
  const visualFilters = variant.scenes.map((_, index) => {
    const drift = index % 2 === 0 ? 'iw/2-(iw/zoom/2)' : 'iw/2-(iw/zoom/2)+8*sin(on/18)';
    return `[${index}:v]scale=${variant.width}:${variant.height}:force_original_aspect_ratio=increase,crop=${variant.width}:${variant.height},` +
      `zoompan=z='min(zoom+0.0008,1.07)':x='${drift}':y='ih/2-(ih/zoom/2)':d=1:s=${variant.width}x${variant.height}:fps=${fps},` +
      `eq=brightness=-0.07:saturation=0.92,drawbox=x=0:y=ih*0.64:w=iw:h=ih*0.36:color=0x07090FCC:t=fill,` +
      `fade=t=in:st=0:d=0.22,fade=t=out:st=${secondsPerScene - 0.25}:d=0.25,trim=duration=${secondsPerScene},setpts=PTS-STARTPTS[v${index}]`;
  });
  const videoInputs = variant.scenes.map((_, index) => `[v${index}]`).join('');
  const audioStart = variant.scenes.length;
  const filter = [
    ...visualFilters,
    `${videoInputs}concat=n=${variant.scenes.length}:v=1:a=0[base]`,
    `[base]subtitles=filename='exports/trailers/${assName}'[vout]`,
    `[${audioStart}:a]volume=0.055,tremolo=f=2:d=0.82[a0]`,
    `[${audioStart + 1}:a]volume=0.022,tremolo=f=4:d=0.9[a1]`,
    `[${audioStart + 2}:a]highpass=f=180,lowpass=f=1800,volume=0.018[a2]`,
    `[a0][a1][a2]amix=inputs=3:duration=first,afade=t=in:st=0:d=0.8,afade=t=out:st=${copy.length * secondsPerScene - 1.5}:d=1.5,alimiter=limit=0.8[aout]`,
  ].join(';');

  run('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex', filter,
    '-map', '[vout]',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '27',
    '-profile:v', 'high',
    '-level', '4.0',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '64k',
    '-movflags', '+faststart',
    '-metadata', 'title=Plundrix - One Vault. No Safe Turn.',
    '-metadata', 'comment=Free-play beta trailer assembled from accepted Plundrix game art and product captures.',
    outputPath,
  ]);

  run('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', `fps=1/${secondsPerScene},scale=${Math.round(variant.width / 4)}:-1,tile=4x2:padding=6:margin=6:color=0x0A0A0F`,
    '-frames:v', '1',
    '-q:v', '3',
    contactPath,
  ]);

  rmSync(assPath, { force: true });
  return { outputPath, contactPath };
}

mkdirSync(outputDir, { recursive: true });
for (const variant of variants) {
  const result = buildVariant(variant);
  console.log(`Built ${result.outputPath}`);
  console.log(`Built ${result.contactPath}`);
}
