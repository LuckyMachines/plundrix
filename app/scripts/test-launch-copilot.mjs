import assert from 'node:assert/strict';
import {
  CHECK_STATUS,
  COMMAND_SAFETY,
  compareGates,
  createLaunchDecision,
  evaluateLaunchCheck,
  exportLaunchChecklistCsv,
  exportLaunchPacketJson,
  exportLaunchPacketMarkdown,
  exportLaunchRiskRegisterMarkdown,
  generateLaunchPlan,
  getChecksForGate,
  nextGate,
  validateLaunchDecision,
  validateLaunchPlan,
} from '../src/lib/launchCopilot.js';

const files = {
  '.gitignore': [
    'app/reports/balance-autopilot/*.json',
    'app/reports/live-ops/*.json',
    'app/reports/launch/*.json',
    'app/reports/playtest/*.json',
    'app/reports/design-control/*.json',
    'app/public/replays/*.png',
  ].join('\n'),
  '.github/workflows/balance-autopilot-smoke.yml': 'npm run test:autopilot\nnpm run test:replay\nnpm run test:oracle\nnpm run test:playtest\nnpm run test:design\nnpm run launch:copilot',
  'README.md': '# Plundrix\nSimulator-backed heist game.',
  'docs/go-live-checklist.md': '- [x] Contract config\n- [x] Legal review\n- [x] Launch monitoring\n',
  'docs/mainnet-runbook.md': '# Runbook\nMonitor alerts and rollback to previous deploy.',
  'docs/dev/deployment.mdx': '# Deployment\nmonitor alert rollback',
  'docs/dev/local-dev.mdx': '# Local',
  'docs/dev/mechanics.mdx': '# Mechanics',
  'docs/dev/balance-autopilot.mdx': '# Balance Autopilot',
  'docs/dev/replay-director.mdx': '# Replay Director',
  'docs/dev/live-ops-oracle.mdx': '# Live Ops Oracle',
  'docs/dev/player-telemetry-ghosts.mdx': '# Player Telemetry Ghosts',
  'docs/dev/rule-mutation-time-machine.mdx': '# Rule Mutation Time Machine',
  'docs/dev/playtest-coach.mdx': '# Self-Teaching Playtest Coach',
  'docs/dev/design-control-tower.mdx': '# Design Control Tower',
  'docs/balance-autopilot-latest.md': '# Balance Autopilot',
  'docs/replay-director-latest.md': '# Replay Director',
  'docs/live-ops-oracle-latest.md': '# Live Ops Oracle',
  'docs/player-telemetry-ghosts-latest.md': '# Player Telemetry Ghosts',
  'docs/rule-mutation-time-machine-latest.md': '# Rule Mutation Time Machine',
  'docs/playtest-coach-latest.md': '# Self-Teaching Playtest Coach',
  'docs/design-control-tower-latest.md': '# Design Control Tower',
  'app/src/pages/TermsPage.jsx': 'export default function TermsPage() {}',
  'app/src/pages/PrivacyPage.jsx': 'export default function PrivacyPage() {}',
  'app/src/pages/SimulatorPage.jsx': 'recommendAction runWhatIf',
  'app/src/pages/ReplaysPage.jsx': 'export default function ReplaysPage() {}',
  'app/src/pages/OpsPage.jsx': 'export default function OpsPage() {}',
  'app/src/pages/GhostsPage.jsx': 'export default function GhostsPage() {}',
  'app/src/pages/MutationsPage.jsx': 'export default function MutationsPage() {}',
  'app/src/pages/PlaytestPage.jsx': 'export default function PlaytestPage() {}',
  'app/src/pages/DesignTowerPage.jsx': 'export default function DesignTowerPage() {}',
  'app/src/config/contract.js': 'export const chain = "sepolia";',
  'app/src/lib/plundrixEngine.js': 'recommendAction runWhatIf',
  'app/src/lib/balanceAutopilot.js': 'export function runAutopilotSearch() {}',
  'app/src/lib/replayDirector.js': 'export function buildReplayFromSeed() {}',
  'app/src/lib/liveOpsOracle.js': 'export function generateOracleReport() {}',
  'app/src/lib/playerTelemetryGhosts.js': 'export function runGhostBatch() {}',
  'app/src/lib/ruleMutationTimeMachine.js': 'export function generateMutationReport() {}',
  'app/src/lib/playtestCoach.js': 'export function buildPlaytestMission() {}',
  'app/src/lib/designControlTower.js': 'export function generateDesignTowerSnapshot() {}',
};

const packageJson = {
  scripts: {
    build: 'vite build',
    simulate: 'node scripts/simulate-game.mjs',
    'simulate:auto-balance': 'node scripts/auto-balance.mjs',
    'replay:direct': 'node scripts/direct-replay.mjs',
    'replay:capture': 'node scripts/capture-replay.mjs',
    'ops:oracle': 'node scripts/live-ops-oracle.mjs',
    'launch:copilot': 'node scripts/launch-copilot.mjs',
    'test:autopilot': 'node scripts/test-balance-autopilot.mjs',
    'test:replay': 'node scripts/test-replay-director.mjs',
    'test:oracle': 'node scripts/test-live-ops-oracle.mjs',
    'test:launch': 'node scripts/test-launch-copilot.mjs',
    'ghosts:run': 'node scripts/player-telemetry-ghosts.mjs',
    'test:ghosts': 'node scripts/test-player-telemetry-ghosts.mjs',
    'mutate:rules': 'node scripts/rule-mutation-time-machine.mjs',
    'mutate:matrix': 'node scripts/rule-mutation-time-machine.mjs --matrix',
    'test:mutations': 'node scripts/test-rule-mutation-time-machine.mjs',
    'playtest:coach': 'node scripts/playtest-coach.mjs',
    'test:playtest': 'node scripts/test-playtest-coach.mjs',
    'design:tower': 'node scripts/design-control-tower.mjs',
    'design:backlog': 'node scripts/design-control-tower.mjs --backlog --csv',
    'test:design': 'node scripts/test-design-control-tower.mjs',
  },
};

const env = {
  VITE_PLUNDRIX_CONTRACT: '0x0000000000000000000000000000000000000001',
  VITE_CHAIN_ID: '11155111',
};

const routeResults = {
  '/': { ok: true, status: 200 },
  '/simulator': { ok: true, status: 200 },
  '/replays': { ok: true, status: 200 },
  '/ghosts': { ok: true, status: 200 },
  '/mutations': { ok: true, status: 200 },
  '/playtest': { ok: true, status: 200 },
  '/design': { ok: true, status: 200 },
  '/ops': { ok: true, status: 200 },
  '/terms': { ok: true, status: 200 },
  '/privacy': { ok: true, status: 200 },
};

assert.equal(compareGates('prototype', 'internal-playtest') < 0, true);
assert.equal(nextGate('internal-playtest'), 'public-testnet');
assert.ok(getChecksForGate('launch-candidate').length > getChecksForGate('prototype').length);

const envCheck = {
  id: 'env-test',
  gate: 'public-testnet',
  category: 'env',
  title: 'Env test',
  required: true,
  envVars: ['VITE_PLUNDRIX_CONTRACT'],
  files: [],
  scripts: [],
  routes: [],
  evidenceText: [],
  remediation: 'Set env.',
};
const evaluatedEnv = evaluateLaunchCheck(envCheck, {
  files,
  packageJson,
  env,
  routeResults,
  simulatorBatch: null,
  replayProof: null,
  oracleReport: null,
});
assert.equal(evaluatedEnv.status, CHECK_STATUS.PASS);
assert.deepEqual(evaluatedEnv.redactedEnv, { VITE_PLUNDRIX_CONTRACT: true });

const plan = generateLaunchPlan({
  targetGate: 'launch-candidate',
  seed: 'launch-test',
  files,
  packageJson,
  env,
  routeResults,
});

validateLaunchPlan(plan);
assert.equal(plan.schemaVersion, 1);
assert.equal(plan.targetGate, 'launch-candidate');
assert.ok(plan.readiness.score > 50, 'launch candidate score is meaningful');
assert.ok(plan.checks.length > 10, 'checks generated');
assert.ok(plan.packet.requiredEvidence.length > 0, 'packet evidence generated');
assert.ok(plan.commandPlan.some((item) => item.safety === COMMAND_SAFETY.LOCAL_SAFE), 'safe command generated');
assert.ok(plan.proof.playtest.id, 'playtest proof generated');
assert.ok(plan.proof.design.id, 'design proof generated');
assert.ok(plan.checks.some((check) => check.id === 'playtest-coach' && check.status === CHECK_STATUS.PASS), 'playtest check passed');
assert.ok(plan.checks.some((check) => check.id === 'design-control-tower' && check.status === CHECK_STATUS.PASS), 'design check passed');
assert.equal(plan.sourceSummary.env.VITE_PLUNDRIX_CONTRACT, true);
assert.equal(exportLaunchPacketMarkdown(plan).includes('# Plundrix Launch Copilot Packet'), true);
assert.equal(exportLaunchPacketJson(plan).includes('"targetGate"'), true);
assert.equal(exportLaunchChecklistCsv(plan).includes('id,gate,category'), true);
assert.equal(exportLaunchRiskRegisterMarkdown(plan).includes('# Launch Risk Register'), true);

const blocked = generateLaunchPlan({
  targetGate: 'public-testnet',
  seed: 'launch-test-blocked',
  files: {
    ...files,
    'docs/go-live-checklist.md': '- [ ] Deploy contract\n- [ ] Legal review\n',
  },
  packageJson,
  env: {},
  routeResults: {},
});
assert.ok(blocked.readiness.blockers.length > 0, 'blockers detected');
assert.equal(blocked.readiness.status, 'blocked');

const invalidDecision = validateLaunchDecision(blocked, {
  status: 'approved',
  operator: 'Tester',
  rationale: 'Ship anyway',
});
assert.equal(invalidDecision.valid, false);

const decision = createLaunchDecision(blocked, {
  status: 'approved',
  operator: 'Tester',
  rationale: 'Controlled internal override.',
  override: true,
  overrideRationale: 'Internal-only audience accepts listed risks.',
  acceptedRisks: blocked.risks.slice(0, 2).map((risk) => risk.id),
});
assert.equal(decision.validation.valid, true);
assert.equal(decision.targetGate, 'public-testnet');

console.log('Launch Copilot tests passed');
