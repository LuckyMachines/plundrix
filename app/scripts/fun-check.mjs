import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { runBatch } from '../src/lib/plundrixEngine.js';
import { buildFunProof } from '../src/lib/funSystems.js';

const args = new Set(process.argv.slice(2));
const jsonMode = args.has('--json');
const writeReport = args.has('--report');
const gamesArg = process.argv.find((arg) => arg.startsWith('--games='));
const games = gamesArg ? Number(gamesArg.split('=')[1]) : 12;

const SCENARIOS = [
  ['new-player-table', 'First match table'],
  ['comeback-test', 'Comeback pressure'],
  ['stall-test', 'Stall risk'],
  ['all-aggressive', 'Aggressive table'],
];

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function runScenario([scenarioId, label]) {
  const batch = runBatch({
    scenarioId,
    games,
    seed: `fun-check-${scenarioId}`,
    maxRounds: 36,
  });
  const funScores = batch.summaries.map((summary) => summary.funScore.score);
  const weakest = [...batch.summaries].sort((a, b) => a.funScore.score - b.funScore.score)[0];
  const strongest = [...batch.summaries].sort((a, b) => b.funScore.score - a.funScore.score)[0];
  const proof = buildFunProof({
    funTelemetry: strongest.funTelemetry,
    funScore: strongest.funScore,
  });

  return {
    scenarioId,
    label,
    games,
    averageFunScore: Math.round(average(funScores)),
    minFunScore: Math.min(...funScores),
    maxFunScore: Math.max(...funScores),
    averageRounds: Number(batch.scorecard.averageRounds.toFixed(1)),
    averageBalanceScore: Math.round(batch.scorecard.score),
    strongestTags: proof.strongestTags,
    weakestSeed: weakest.seed,
    weakestScore: weakest.funScore.score,
    gaps: weakest.funScore.score < 70
      ? buildFunProof({ funTelemetry: weakest.funTelemetry, funScore: weakest.funScore }).gaps
      : [],
  };
}

const results = SCENARIOS.map(runScenario);
const aggregate = Math.round(average(results.map((result) => result.averageFunScore)));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  gamesPerScenario: games,
  aggregateFunScore: aggregate,
  grade: aggregate >= 90 ? 'A' : aggregate >= 80 ? 'B' : aggregate >= 70 ? 'C' : aggregate >= 60 ? 'D' : 'F',
  scenarios: results,
  recommendations: results.flatMap((result) => {
    const lines = [];
    if (result.averageFunScore < 70) lines.push(`${result.label}: raise agency, drama, or rhythm before promotion.`);
    if (result.gaps.length) lines.push(`${result.label}: inspect ${result.weakestSeed} for ${result.gaps.join('; ')}.`);
    if (result.minFunScore >= 70) lines.push(`${result.label}: fun floor held across the smoke sample.`);
    return lines;
  }),
};

function toMarkdown(data) {
  const rows = data.scenarios.map((result) =>
    `| ${result.label} | ${result.averageFunScore} | ${result.minFunScore}-${result.maxFunScore} | ${result.averageRounds} | ${result.strongestTags.join(', ') || 'None'} |`,
  );
  return [
    '# Plundrix Fun Check',
    '',
    `Aggregate: ${data.grade} (${data.aggregateFunScore}/100)`,
    `Games per scenario: ${data.gamesPerScenario}`,
    '',
    '| Scenario | Avg fun | Range | Avg rounds | Strongest tags |',
    '| --- | ---: | --- | ---: | --- |',
    ...rows,
    '',
    '## Recommendations',
    '',
    ...(data.recommendations.length ? data.recommendations.map((line) => `- ${line}`) : ['- Fun floor held across the smoke sample.']),
    '',
  ].join('\n');
}

if (writeReport) {
  const reportPath = resolve(process.cwd(), 'reports', 'fun-check-latest.md');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, toMarkdown(report));
  report.reportPath = join('reports', 'fun-check-latest.md');
}

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(toMarkdown(report));
  if (report.reportPath) {
    console.log(`Saved ${report.reportPath}`);
  }
}

if (aggregate < 70) {
  process.exitCode = 1;
}
