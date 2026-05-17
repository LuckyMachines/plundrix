import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  buildPairedReplayComparison,
  buildReplayFromSeed,
  buildReplaysFromAutopilot,
  buildReplaysFromBatch,
  buildReplayGalleryData,
  exportReplayCsv,
  exportReplayJson,
  exportReplayMarkdown,
} from '../src/lib/replayDirector.js';
import { runBatch } from '../src/lib/plundrixEngine.js';

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

function listArg(value) {
  return value ? String(value).split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function printReplay(replay) {
  console.log('Plundrix Replay Director');
  console.log(`id: ${replay.id}`);
  console.log(`title: ${replay.title}`);
  console.log(`score: ${replay.dramaticScore.toFixed(1)}`);
  console.log(`seed: ${replay.seed}`);
  console.log(`scenario: ${replay.scenarioId}`);
  console.log(`rounds: ${replay.summary.rounds}`);
  console.log(`share: ${replay.shareUrl}`);
  console.log('highlights:');
  for (const highlight of replay.highlights.slice(0, 5)) {
    console.log(`  - R${highlight.round} ${highlight.replayLabel}: ${highlight.text}`);
  }
}

function printTable(replays) {
  console.log('Plundrix Replay Director batch');
  for (const [index, replay] of replays.entries()) {
    console.log(`#${index + 1} ${replay.id} score=${replay.dramaticScore.toFixed(1)} rounds=${replay.summary.rounds} title=${replay.title}`);
  }
}

const args = readArgs(process.argv.slice(2));
const options = {
  seed: args.seed || 'replay-cli',
  scenarioId: args.scenario || 'new-player-table',
  strategies: listArg(args.strategies) || ['balanced', 'picker', 'searcher', 'saboteur'],
  maxRounds: numberArg(args['max-rounds'], 40),
};

let output;

if (args['from-autopilot']) {
  const report = JSON.parse(await readFile(args['from-autopilot'], 'utf8'));
  output = buildReplaysFromAutopilot(report, { limit: numberArg(args.limit, 8) });
} else if (args.batch) {
  const batch = runBatch({
    ...options,
    games: numberArg(args.batch, 50),
    includeStates: true,
  });
  output = buildReplaysFromBatch(batch, { limit: numberArg(args.limit, 8), scenarioId: options.scenarioId });
} else if (args.paired) {
  output = buildPairedReplayComparison({
    ...options,
    games: numberArg(args.games, 12),
  });
} else {
  output = buildReplayFromSeed(options);
}

if (args.gallery) {
  const replays = Array.isArray(output) ? output : [output.tuned || output];
  const gallery = buildReplayGalleryData(replays);
  if (args.out) {
    await writeOutput(join(process.cwd(), args.out), JSON.stringify(gallery, null, 2));
  }
  console.log(JSON.stringify(gallery, null, 2));
} else if (args['capture-plan']) {
  const replay = Array.isArray(output) ? output[0] : output.tuned || output;
  console.log(JSON.stringify(replay.capturePlan, null, 2));
} else if (args.json) {
  console.log(Array.isArray(output) || output.baseline ? JSON.stringify(output, null, 2) : exportReplayJson(output));
} else if (args.markdown) {
  const replay = Array.isArray(output) ? output[0] : output.tuned || output;
  console.log(exportReplayMarkdown(replay));
} else if (args.csv) {
  const replays = Array.isArray(output) ? output : [output.tuned || output];
  console.log(exportReplayCsv(replays));
} else if (Array.isArray(output)) {
  printTable(output);
} else if (output.tuned) {
  printReplay(output.tuned);
  console.log(`pairedDelta: ${output.scoreDelta.toFixed(1)}`);
} else {
  printReplay(output);
}
