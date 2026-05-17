import {
  SIM_DEFAULT_RULES,
  compareRulesets,
  exportBatchCsv,
  normalizeRuleset,
  normalizeStrategyProfile,
  runBatch,
  runSimulation,
  summarizeSimulation,
} from '../src/lib/plundrixEngine.js';

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

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJsonArg(value, fallback = {}) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    try {
      const repaired = String(value).replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
      return JSON.parse(repaired);
    } catch {
      return fallback;
    }
  }
}

function parseList(value) {
  return value ? String(value).split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

function printSingle(summary) {
  console.log('Plundrix simulation');
  console.log(`seed: ${summary.seed}`);
  console.log(`scenario: ${summary.scenarioId}`);
  console.log(`winner: ${summary.winnerName || 'none'}`);
  console.log(`rounds: ${summary.rounds}`);
  console.log(`tension: ${summary.averageTension.toFixed(1)}`);
  console.log(`picks: ${summary.pickSuccesses}/${summary.picks}`);
  console.log(`searches: ${summary.searchSuccesses}/${summary.searches}`);
  console.log(`sabotages: ${summary.sabotageSuccesses}/${summary.sabotages}`);
  console.log(`comeback: ${summary.comeback}`);
  console.log(`runaway: ${summary.runaway}`);
}

function printBatch(result) {
  console.log('Plundrix batch simulation');
  console.log(`games: ${result.games}`);
  console.log(`completed: ${result.completed}`);
  console.log(`grade: ${result.scorecard.grade}`);
  console.log(`score: ${result.scorecard.score.toFixed(1)}`);
  console.log(`averageRounds: ${result.averageRounds.toFixed(2)}`);
  console.log(`comebackRate: ${(result.scorecard.comebackRate * 100).toFixed(1)}%`);
  console.log(`runawayRate: ${(result.scorecard.runawayRate * 100).toFixed(1)}%`);
  console.log('winRates:');
  for (const [playerId, wins] of Object.entries(result.winCounts)) {
    console.log(`  ${playerId}: ${wins}/${result.games} (${((wins / result.games) * 100).toFixed(1)}%)`);
  }
  console.log('warnings:');
  for (const flag of result.dashboard.flags) {
    console.log(`  - ${flag}`);
  }
}

function printComparison(result) {
  console.log('Plundrix rules comparison');
  console.log(`baselineScore: ${result.baseline.scorecard.score.toFixed(1)}`);
  console.log(`candidateScore: ${result.candidate.scorecard.score.toFixed(1)}`);
  console.log(`scoreDelta: ${result.deltas.score.toFixed(1)}`);
  console.log(`averageRoundsDelta: ${result.deltas.averageRounds.toFixed(2)}`);
  console.log(`winSpreadDelta: ${(result.deltas.winSpread * 100).toFixed(1)}%`);
  console.log(`runawayDelta: ${(result.deltas.runawayRate * 100).toFixed(1)}%`);
  console.log(`comebackDelta: ${(result.deltas.comebackRate * 100).toFixed(1)}%`);
}

const args = readArgs(process.argv.slice(2));
const options = {
  scenarioId: args.scenario || undefined,
  playerCount: numberArg(args.players, undefined),
  seed: args.seed || 'plundrix-cli',
  maxRounds: numberArg(args['max-rounds'], 40),
  strategies: parseList(args.strategies),
  strategyProfile: normalizeStrategyProfile(parseJsonArg(args.profile)),
  rules: normalizeRuleset({ ...SIM_DEFAULT_RULES, ...parseJsonArg(args.rules) }),
};

if (args.compare) {
  const result = compareRulesets({
    ...options,
    games: numberArg(args.games, 100),
    baselineRules: SIM_DEFAULT_RULES,
    candidateRules: options.rules,
  });
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printComparison(result);
  }
} else if (args.games) {
  const result = runBatch({
    ...options,
    games: numberArg(args.games, 100),
  });
  if (args.csv) {
    console.log(exportBatchCsv(result));
  } else if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printBatch(result);
  }
} else {
  const state = runSimulation(options);
  const summary = summarizeSimulation(state);
  if (args.json) {
    console.log(JSON.stringify({ summary, state }, null, 2));
  } else {
    printSingle(summary);
  }
}
