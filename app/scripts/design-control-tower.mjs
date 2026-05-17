import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { generateLaunchPlan, LAUNCH_REQUIRED_SOURCES } from '../src/lib/launchCopilot.js';
import { generateOracleReport } from '../src/lib/liveOpsOracle.js';
import {
  createDesignHypothesis,
  exportDesignBacklogCsv,
  exportDesignPacketJson,
  exportDesignPacketMarkdown,
  generateDecisionMemo,
  generateDesignBacklog,
  generateDesignTowerSnapshot,
} from '../src/lib/designControlTower.js';

const ROOT = resolve(process.cwd(), '..');

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

async function readLaunchFiles(extraFiles = []) {
  const paths = [
    '.gitignore',
    'README.md',
    '.github/workflows/balance-autopilot-smoke.yml',
    ...LAUNCH_REQUIRED_SOURCES.files,
    'app/src/lib/plundrixEngine.js',
    'app/src/lib/balanceAutopilot.js',
    'app/src/lib/replayDirector.js',
    'app/src/lib/liveOpsOracle.js',
    'app/src/lib/playerTelemetryGhosts.js',
    'app/src/lib/ruleMutationTimeMachine.js',
    'app/src/lib/playtestCoach.js',
    'app/src/lib/designControlTower.js',
    ...extraFiles,
  ];
  const entries = await Promise.all([...new Set(paths)].sort().map(async (path) => {
    const full = join(ROOT, path);
    if (!existsSync(full)) return [path, ''];
    return [path, await readFile(full, 'utf8')];
  }));
  return Object.fromEntries(entries);
}

async function buildSnapshot(args) {
  const seed = args.seed || 'design-control-cli';
  const packageJson = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
  const files = await readLaunchFiles(String(args.files || '').split(',').map((item) => item.trim()).filter(Boolean));
  const oracleReport = args.oracle === false ? null : generateOracleReport({
    seed: `${seed}-oracle`,
    heavy: Boolean(args.heavy),
    horizon: 'design-control',
    files,
    packageJson,
  });
  const launchPlan = args.launch === false ? null : generateLaunchPlan({
    seed: `${seed}-launch`,
    targetGate: args.target || 'internal-playtest',
    heavy: false,
    files,
    packageJson,
  });
  return generateDesignTowerSnapshot({
    seed,
    heavy: Boolean(args.heavy),
    oracleReport,
    launchPlan,
  });
}

function printSummary(snapshot) {
  console.log('Plundrix Design Control Tower');
  console.log(`generatedAt: ${snapshot.generatedAt}`);
  console.log(`mode: ${snapshot.mode}`);
  console.log(`health: ${snapshot.health.score}/100 (${snapshot.health.status})`);
  console.log(`hypotheses: ${snapshot.topHypotheses.length}`);
  console.log(`humanValidationGaps: ${snapshot.health.humanValidationGapCount}`);
  console.log('');
  console.log('Top hypotheses:');
  for (const hypothesis of snapshot.topHypotheses.slice(0, 5)) {
    console.log(`- ${hypothesis.title}: ${hypothesis.score.total}/100 - ${hypothesis.nextAction}`);
  }
  console.log('');
  console.log('Next commands:');
  for (const command of snapshot.recommendedCommands.slice(0, 6)) {
    console.log(`- ${command}`);
  }
}

const args = readArgs(process.argv.slice(2));
const snapshot = await buildSnapshot(args);
const backlog = generateDesignBacklog({ hypotheses: snapshot.topHypotheses });
const memoHypothesis = snapshot.topHypotheses[0] || createDesignHypothesis({
  title: 'Design Control Tower baseline',
  category: 'onboarding',
  claim: 'The project needs a durable design decision memory.',
});

if (args.out) {
  const content = args.csv
    ? exportDesignBacklogCsv(backlog)
    : args.json
      ? exportDesignPacketJson(snapshot)
      : args.memo
        ? JSON.stringify(generateDecisionMemo(memoHypothesis), null, 2)
        : exportDesignPacketMarkdown(snapshot);
  await writeOutput(join(process.cwd(), args.out), content);
}

if (args.report) {
  await writeOutput(
    join(process.cwd(), 'reports', 'design-control', `design-control-${Date.now()}.md`),
    exportDesignPacketMarkdown(snapshot),
  );
}

if (args.csv || args.backlog) {
  console.log(exportDesignBacklogCsv(backlog));
} else if (args.json) {
  console.log(JSON.stringify(snapshot, null, 2));
} else if (args.memo) {
  console.log(JSON.stringify(generateDecisionMemo(memoHypothesis), null, 2));
} else if (args.markdown || args.snapshot) {
  console.log(exportDesignPacketMarkdown(snapshot));
} else if (existsSync(join(process.cwd(), 'package.json'))) {
  printSummary(snapshot);
}
