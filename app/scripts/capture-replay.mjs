import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { buildReplayFromSeed, REPLAY_CAPTURE_PRESETS } from '../src/lib/replayDirector.js';

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

const args = readArgs(process.argv.slice(2));
const preset = REPLAY_CAPTURE_PRESETS[args.preset || 'desktop'] || REPLAY_CAPTURE_PRESETS.desktop;
const baseUrl = args.baseUrl || 'http://127.0.0.1:5175';
const replay = buildReplayFromSeed({
  seed: args.seed || 'capture-replay',
  scenarioId: args.scenario || 'new-player-table',
});
const outDir = join(process.cwd(), 'public', 'replays');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed in this app. Install it before running replay:capture.');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: preset });

for (const shot of replay.capturePlan.screenshots) {
  const url = `${baseUrl}${shot.url}`;
  const path = join(outDir, `${replay.id}-${shot.name.replaceAll(' ', '-')}.png`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path, fullPage: true });
  const info = await stat(path);
  if (info.size < 1024) {
    throw new Error(`Screenshot appears empty: ${path}`);
  }
  console.log(`${path} ${info.size} bytes`);
}

await browser.close();
