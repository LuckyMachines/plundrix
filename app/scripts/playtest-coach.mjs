import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  buildMissionFromGhostReport,
  buildMissionFromMutationReport,
  buildMissionFromReplay,
  buildPlaytestMission,
  createSyntheticPlaytestSession,
  exportPlaytestBacklogCsv,
  exportPlaytestMissionJson,
  exportPlaytestMissionMarkdown,
  exportPlaytestReportMarkdown,
  generatePlaytestBacklog,
  generatePlaytestReport,
} from '../src/lib/playtestCoach.js';
import { runGhostBatch } from '../src/lib/playerTelemetryGhosts.js';
import { generateMutationReport } from '../src/lib/ruleMutationTimeMachine.js';
import { buildReplayFromSeed } from '../src/lib/replayDirector.js';

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

function buildMission(args) {
  const common = {
    sourceType: args.source || 'manual-design-question',
    category: args.category,
    question: args.question,
    duration: args.duration || '15-minute playtest',
    testers: args.testers ? Number(args.testers) : 4,
    seed: args.seed || 'playtest-cli',
    scenario: args.scenario || 'new-player-table',
    ghostScenario: args['ghost-scenario'] || 'balanced-cast',
    mutationPreset: args['mutation-preset'] || 'faster-games',
  };
  if (common.sourceType === 'mutation-report') {
    return buildMissionFromMutationReport(generateMutationReport({
      seed: common.seed,
      preset: common.mutationPreset,
      scenario: common.scenario,
      ghostScenario: common.ghostScenario,
      budget: 'smoke',
    }), common);
  }
  if (common.sourceType === 'ghost-report') {
    return buildMissionFromGhostReport(runGhostBatch({
      seed: common.seed,
      scenario: common.ghostScenario,
      budget: 'smoke',
      games: 3,
    }), common);
  }
  if (common.sourceType === 'replay-proof') {
    return buildMissionFromReplay(buildReplayFromSeed({
      seed: common.seed,
      scenarioId: common.scenario,
      maxRounds: 36,
    }), common);
  }
  return buildPlaytestMission(common);
}

function printSummary(mission) {
  console.log('Plundrix Self-Teaching Playtest Coach');
  console.log(`mission: ${mission.title}`);
  console.log(`category: ${mission.category}`);
  console.log(`difficulty: ${mission.difficulty}`);
  console.log(`question: ${mission.designQuestion}`);
  console.log(`roles: ${mission.roleAssignments.map((item) => `${item.label}=${item.role}`).join(', ')}`);
  console.log(`nextMachineRun: ${mission.recommendedMachineRuns[0]}`);
}

const args = readArgs(process.argv.slice(2));

if (args.backlog) {
  const backlog = generatePlaytestBacklog();
  if (args.out) await writeOutput(join(process.cwd(), args.out), exportPlaytestBacklogCsv(backlog));
  if (args.csv) {
    console.log(exportPlaytestBacklogCsv(backlog));
  } else {
    console.log(exportPlaytestBacklogCsv(backlog));
  }
} else {
  const mission = buildMission(args);
  const session = createSyntheticPlaytestSession(mission, {
    comprehension: 4,
    agency: 4,
    tension: 4,
    fairness: 4,
    frustration: 2,
    replayability: 4,
    setupFriction: 2,
    rememberedMoment: 'Smoke placeholder session for report shape.',
    wouldReplay: true,
    wouldShare: true,
  });
  const report = generatePlaytestReport(mission, [session]);
  if (args.out) {
    const content = args.json
      ? exportPlaytestMissionJson(mission)
      : args.report
        ? exportPlaytestReportMarkdown(report)
        : exportPlaytestMissionMarkdown(mission);
    await writeOutput(join(process.cwd(), args.out), content);
  }
  if (args.json) {
    console.log(exportPlaytestMissionJson(mission));
  } else if (args.report) {
    console.log(exportPlaytestReportMarkdown(report));
  } else if (args.markdown) {
    console.log(exportPlaytestMissionMarkdown(mission));
  } else {
    printSummary(mission);
  }
}
