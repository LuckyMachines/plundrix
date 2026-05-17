import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  exportMutationMatrixCsv,
  exportMutationReportJson,
  exportMutationReportMarkdown,
  exportRuleDiffCsv,
  generateMutationMatrix,
  generateMutationReport,
  parseRulePatch,
} from '../src/lib/ruleMutationTimeMachine.js';

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

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function printReportSummary(report) {
  const comparison = report.comparison;
  console.log('Plundrix Rule Mutation Time Machine');
  console.log(`generatedAt: ${report.generatedAt}`);
  console.log(`preset: ${comparison.scenario.preset.label}`);
  console.log(`verdict: ${report.verdict}`);
  console.log(`score: ${report.score.total}/100`);
  console.log(`changedRules: ${comparison.ruleDiffDescription}`);
  console.log(`winnerChanged: ${comparison.simulation.winnerChanged}`);
  console.log(`roundDelta: ${comparison.simulation.roundDelta}`);
  console.log(`dramaDelta: ${comparison.replay.delta.dramaticScore.toFixed(2)}`);
  console.log(`ghostScoreDelta: ${comparison.ghosts.scoreDelta}`);
  console.log(`contractImpact: ${comparison.contractImpact.level}`);
  console.log(`recommendation: ${report.recommendation.summary}`);
}

function printMatrixSummary(matrix) {
  console.log('Plundrix Rule Mutation Matrix');
  console.log(`generatedAt: ${matrix.generatedAt}`);
  console.log(`budget: ${matrix.budget}`);
  console.log(`best: ${matrix.best?.label || 'none'} (${matrix.best?.score || 0})`);
  console.log('');
  for (const row of matrix.rows) {
    console.log(`- ${row.label}: ${row.score}/100, ${row.verdict}, rounds ${row.roundDelta}, drama ${row.dramaDelta.toFixed(1)}, ghosts ${row.ghostDelta}, ${row.contractImpact}`);
  }
}

const args = readArgs(process.argv.slice(2));
const budget = args.budget || 'smoke';
if (budget === 'deep' && !args.deep) {
  throw new Error('Deep mutation runs require --deep.');
}

const common = {
  preset: args.preset || 'faster-games',
  seed: args.seed || 'mutation-cli',
  scenario: args.scenario || 'new-player-table',
  ghostScenario: args['ghost-scenario'] || 'balanced-cast',
  budget,
  patch: parseRulePatch(args.patch || ''),
};

if (args.matrix) {
  const matrix = generateMutationMatrix(common);
  if (args.out) {
    const content = args.json
      ? JSON.stringify(matrix, null, 2)
      : exportMutationMatrixCsv(matrix);
    await writeOutput(join(process.cwd(), args.out), content);
  }
  if (args.json) {
    console.log(JSON.stringify(matrix, null, 2));
  } else if (args.csv) {
    console.log(exportMutationMatrixCsv(matrix));
  } else if (args.markdown) {
    const best = matrix.best?.report;
    console.log(best ? exportMutationReportMarkdown(best) : '# Plundrix Rule Mutation Matrix\n\nNo rows.');
  } else {
    printMatrixSummary(matrix);
  }
} else {
  const report = generateMutationReport(common);
  if (args.out) {
    const content = args.json
      ? exportMutationReportJson(report)
      : args.csv
        ? exportRuleDiffCsv(report.comparison.ruleDiff)
        : exportMutationReportMarkdown(report);
    await writeOutput(join(process.cwd(), args.out), content);
  }
  if (args.report) {
    await writeOutput(
      join(process.cwd(), 'reports', 'mutations', `rule-mutation-${Date.now()}.md`),
      exportMutationReportMarkdown(report),
    );
  }
  if (args.json) {
    console.log(exportMutationReportJson(report));
  } else if (args.csv) {
    console.log(exportRuleDiffCsv(report.comparison.ruleDiff));
  } else if (args.markdown) {
    console.log(exportMutationReportMarkdown(report));
  } else {
    printReportSummary(report);
  }
}
