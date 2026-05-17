import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  AUTOPILOT_BUDGETS,
  OBJECTIVE_PRESETS,
  RULE_BOUNDS,
  RULE_STEPS,
  STRATEGY_MATCHUPS,
  exportAutopilotCsv,
  exportAutopilotJson,
  exportAutopilotMarkdown,
  findInterestingSeeds,
  normalizeAutopilotConfig,
  runAutopilotSearch,
} from '../src/lib/balanceAutopilot.js';
import { addReplayDirectorScoresToAutopilotReport } from '../src/lib/replayDirector.js';

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
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

export function parseJsonish(value, fallback = {}) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    const repaired = String(value)
      .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/:\s*([A-Za-z][A-Za-z0-9_-]*)\s*([,}])/g, ':"$1"$2');
    return JSON.parse(repaired);
  }
}

function listArg(value) {
  return value ? String(value).split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolArg(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  if (value === true) {
    return true;
  }
  return !['false', '0', 'no'].includes(String(value).toLowerCase());
}

function buildConfig(args) {
  const matchup = args.matchup && STRATEGY_MATCHUPS[args.matchup]
    ? STRATEGY_MATCHUPS[args.matchup]
    : undefined;
  return normalizeAutopilotConfig({
    mode: args.mode || 'random',
    budget: args.budget || 'fast',
    seed: args.seed || 'balance-cli',
    iterations: numberArg(args.iterations, undefined),
    games: numberArg(args.games, undefined),
    scenarios: listArg(args.scenarios),
    objective: args.objective || 'default',
    playerCount: numberArg(args.players, undefined),
    strategies: listArg(args.strategies) || matchup,
    strategyProfile: parseJsonish(args.profile, undefined),
    baselineRules: parseJsonish(args.baselineRules, undefined),
    bounds: parseJsonish(args.bounds, RULE_BOUNDS),
    steps: parseJsonish(args.steps, RULE_STEPS),
    lockedKeys: listArg(args.locked),
    maxRounds: numberArg(args['max-rounds'], undefined),
    rotateSeats: boolArg(args.rotateSeats, true),
    rerank: boolArg(args.rerank, true),
    validate: boolArg(args.validate, true),
    topN: numberArg(args.top, undefined),
    gridKeys: listArg(args.gridKeys),
    gridLimit: numberArg(args.gridLimit, undefined),
    tuningMode: args.tuningMode || 'future-contract',
  });
}

function printHelp() {
  console.log('Plundrix Balance Autopilot');
  console.log('');
  console.log('Examples:');
  console.log('  npm run simulate:auto-balance -- --budget smoke');
  console.log('  npm run simulate:auto-balance -- --mode beam --budget normal --objective comeback');
  console.log('  npm run simulate:auto-balance -- --find-seeds exciting --iterations 100');
  console.log('');
  console.log(`Budgets: ${Object.keys(AUTOPILOT_BUDGETS).join(', ')}`);
  console.log(`Objectives: ${Object.keys(OBJECTIVE_PRESETS).join(', ')}`);
}

function printSummary(report) {
  const best = report.topCandidates[0];
  console.log('Plundrix Balance Autopilot');
  console.log(`generatedAt: ${report.generatedAt}`);
  console.log(`mode: ${report.config.mode}`);
  console.log(`budget: ${report.config.budgetName}`);
  console.log(`baselineScore: ${report.baseline.objectiveScore.toFixed(2)}`);
  console.log(`bestCandidate: ${best?.id || 'none'}`);
  console.log(`bestScore: ${best ? best.objectiveScore.toFixed(2) : '0.00'}`);
  console.log(`scoreDelta: ${report.summary.scoreDelta.toFixed(2)}`);
  console.log(`readiness: ${best?.shipReadiness || 'none'}`);
  console.log(`changedKeys: ${best?.changedKeys.join(', ') || 'none'}`);
  console.log('');
  console.log('Top candidates:');
  for (const candidate of report.topCandidates.slice(0, 5)) {
    console.log(
      `  #${candidate.rank} ${candidate.id} score=${candidate.objectiveScore.toFixed(2)} readiness=${candidate.shipReadiness} changed=${candidate.changedKeys.join('|') || 'none'}`,
    );
  }
  console.log('');
  console.log(report.contract.deployedBehaviorNote);
}

function printSeeds(seeds) {
  console.log('Plundrix seed discovery');
  for (const seed of seeds) {
    console.log(`${seed.seed} score=${seed.score.toFixed(2)} scenario=${seed.scenarioId} rounds=${seed.summary.rounds} replay=${seed.replayLink}`);
  }
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

const args = readArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (args['find-seeds']) {
  const seeds = findInterestingSeeds({
    kind: args['find-seeds'] === true ? 'exciting' : args['find-seeds'],
    iterations: numberArg(args.iterations, 50),
    limit: numberArg(args.limit, 10),
    seed: args.seed || 'balance-seeds',
    scenarios: listArg(args.scenarios),
  });
  if (args.json) {
    console.log(JSON.stringify(seeds, null, 2));
  } else {
    printSeeds(seeds);
  }
  process.exit(0);
}

const config = buildConfig(args);
let lastPrinted = 0;
let report = runAutopilotSearch({
  ...config,
  onProgress: (progress) => {
    const shouldPrint = progress.completed === progress.total || progress.completed - lastPrinted >= Math.max(1, Math.ceil(progress.total / 10));
    if (args.quiet || args.json || args.csv || args.markdown || !shouldPrint) {
      return;
    }
    lastPrinted = progress.completed;
    console.error(
      `Candidate ${progress.completed}/${progress.total} current=${progress.current.objectiveScore.toFixed(1)} best=${progress.best.objectiveScore.toFixed(1)} ${progress.best.id}`,
    );
  },
});
report = addReplayDirectorScoresToAutopilotReport(report);

if (args.out) {
  const outputPath = join(process.cwd(), args.out);
  const format = args.format || (args.csv ? 'csv' : args.markdown ? 'markdown' : 'json');
  const content =
    format === 'csv'
      ? exportAutopilotCsv(report)
      : format === 'markdown'
        ? exportAutopilotMarkdown(report)
        : exportAutopilotJson(report);
  await writeOutput(outputPath, content);
}

if (args.report) {
  await writeOutput(
    join(process.cwd(), 'reports', 'balance-autopilot', `balance-autopilot-${Date.now()}.md`),
    exportAutopilotMarkdown(report),
  );
}

if (args.csv) {
  console.log(exportAutopilotCsv(report));
} else if (args.markdown) {
  console.log(exportAutopilotMarkdown(report));
} else if (args.json) {
  console.log(exportAutopilotJson(report));
} else {
  printSummary(report);
}
