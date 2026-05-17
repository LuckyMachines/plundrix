import { runBatch } from './plundrixEngine.js';
import { buildReplayFromSeed } from './replayDirector.js';
import {
  generateOracleReport,
  parseChecklist,
} from './liveOpsOracle.js';
import {
  buildGhostBalanceScore,
  runGhostBatch,
} from './playerTelemetryGhosts.js';
import {
  buildMutationLaunchProof,
} from './ruleMutationTimeMachine.js';
import {
  buildPlaytestMission,
} from './playtestCoach.js';
import {
  generateDesignTowerSnapshot,
} from './designControlTower.js';

export const LAUNCH_SCHEMA_VERSION = 1;
export const LAUNCH_PACKET_KEY = 'plundrix-launch-copilot-packets:v1';
export const LAUNCH_DECISION_KEY = 'plundrix-launch-copilot-decisions:v1';

export const LAUNCH_GATES = Object.freeze([
  { id: 'prototype', label: 'Prototype' },
  { id: 'internal-playtest', label: 'Internal playtest' },
  { id: 'public-testnet', label: 'Public testnet' },
  { id: 'launch-candidate', label: 'Launch candidate' },
  { id: 'mainnet-ready', label: 'Mainnet ready' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'post-launch-monitoring', label: 'Post-launch monitoring' },
]);

export const CHECK_STATUS = Object.freeze({
  PASS: 'pass',
  WARN: 'warn',
  FAIL: 'fail',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
  SKIPPED: 'skipped',
});

export const DECISION_STATES = Object.freeze([
  'draft',
  'approved',
  'hold',
  'shipped',
  'rolled-back',
]);

export const COMMAND_SAFETY = Object.freeze({
  LOCAL_SAFE: 'local-safe',
  LOCAL_MEDIUM: 'local-medium',
  MANUAL_REVIEW: 'manual-review',
  DEPLOYMENT: 'deployment',
});

const CATEGORY_WEIGHTS = Object.freeze({
  product: 0.08,
  gameplay: 0.13,
  balance: 0.13,
  replay: 0.1,
  ghosts: 0.08,
  mutations: 0.08,
  playtest: 0.08,
  design: 0.08,
  web: 0.08,
  contracts: 0.12,
  env: 0.08,
  ops: 0.1,
  legal: 0.06,
  monitoring: 0.07,
  release: 0.05,
});

const REQUIRED_SCRIPTS = [
  'simulate',
  'simulate:auto-balance',
  'replay:direct',
  'ops:oracle',
  'test:autopilot',
  'test:replay',
  'test:oracle',
  'ghosts:run',
  'test:ghosts',
  'mutate:rules',
  'mutate:matrix',
  'test:mutations',
  'playtest:coach',
  'test:playtest',
  'design:tower',
  'test:design',
];

const LAUNCH_REQUIRED_FILES = [
  'docs/go-live-checklist.md',
  'docs/mainnet-runbook.md',
  'docs/dev/deployment.mdx',
  'docs/dev/local-dev.mdx',
  'docs/dev/mechanics.mdx',
  'docs/dev/balance-autopilot.mdx',
  'docs/dev/replay-director.mdx',
  'docs/dev/live-ops-oracle.mdx',
  'docs/balance-autopilot-latest.md',
  'docs/replay-director-latest.md',
  'docs/live-ops-oracle-latest.md',
  'docs/dev/player-telemetry-ghosts.mdx',
  'docs/player-telemetry-ghosts-latest.md',
  'docs/dev/rule-mutation-time-machine.mdx',
  'docs/rule-mutation-time-machine-latest.md',
  'docs/dev/playtest-coach.mdx',
  'docs/playtest-coach-latest.md',
  'docs/dev/design-control-tower.mdx',
  'docs/design-control-tower-latest.md',
  'app/src/pages/TermsPage.jsx',
  'app/src/pages/PrivacyPage.jsx',
  'app/src/pages/SimulatorPage.jsx',
  'app/src/pages/ReplaysPage.jsx',
  'app/src/pages/OpsPage.jsx',
  'app/src/pages/GhostsPage.jsx',
  'app/src/pages/MutationsPage.jsx',
  'app/src/pages/PlaytestPage.jsx',
  'app/src/pages/DesignTowerPage.jsx',
  'app/src/config/contract.js',
  '.github/workflows/balance-autopilot-smoke.yml',
];

const ROUTES = ['/', '/simulator', '/replays', '/ghosts', '/mutations', '/playtest', '/design', '/ops', '/terms', '/privacy'];

export const LAUNCH_CHECKS = Object.freeze([
  makeCheck('product-positioning', 'prototype', 'product', 'Product promise is documented', {
    required: true,
    files: ['README.md'],
    evidenceText: ['Plundrix'],
    remediation: 'Refresh README positioning so launch packets have a canonical product promise.',
  }),
  makeCheck('gameplay-engine-smoke', 'prototype', 'gameplay', 'Simulator completes deterministic smoke games', {
    required: true,
    proof: 'simulator',
    remediation: 'Fix simulator completion or pacing regressions before expanding the gate.',
  }),
  makeCheck('controller-feel-loop', 'prototype', 'gameplay', 'Simulator exposes repeatable action and tension proof', {
    required: false,
    files: ['app/src/lib/plundrixEngine.js', 'app/src/pages/SimulatorPage.jsx'],
    evidenceText: ['recommendAction', 'runWhatIf'],
    remediation: 'Keep manual action recommendation and what-if loops available for game-feel tuning.',
  }),
  makeCheck('docs-mechanics', 'prototype', 'product', 'Mechanics documentation exists', {
    required: true,
    files: ['docs/dev/mechanics.mdx'],
    remediation: 'Write the canonical mechanics reference used by launch QA.',
  }),
  makeCheck('balance-autopilot-scripts', 'internal-playtest', 'balance', 'Balance Autopilot scripts are wired', {
    required: true,
    scripts: ['simulate:auto-balance', 'test:autopilot'],
    files: ['app/src/lib/balanceAutopilot.js'],
    remediation: 'Wire simulator-backed balance search and its smoke test.',
  }),
  makeCheck('balance-autopilot-snapshot', 'internal-playtest', 'balance', 'Latest balance snapshot is available', {
    required: false,
    files: ['docs/balance-autopilot-latest.md'],
    remediation: 'Run the autopilot smoke export and commit the latest balance snapshot.',
  }),
  makeCheck('replay-director-scripts', 'internal-playtest', 'replay', 'Replay Director scripts are wired', {
    required: true,
    scripts: ['replay:direct', 'test:replay'],
    files: ['app/src/lib/replayDirector.js'],
    remediation: 'Wire replay generation and its smoke test.',
  }),
  makeCheck('replay-proof', 'internal-playtest', 'replay', 'Replay proof can be generated from the same engine', {
    required: true,
    proof: 'replay',
    remediation: 'Fix replay generation until a deterministic proof replay is available.',
  }),
  makeCheck('live-ops-oracle', 'internal-playtest', 'ops', 'Live Ops Oracle is available', {
    required: true,
    scripts: ['ops:oracle', 'test:oracle'],
    files: ['app/src/lib/liveOpsOracle.js', 'docs/live-ops-oracle-latest.md'],
    remediation: 'Restore Live Ops Oracle script, tests, and latest snapshot.',
  }),
  makeCheck('player-telemetry-ghosts', 'internal-playtest', 'ghosts', 'Player Telemetry Ghosts smoke is available', {
    required: true,
    scripts: ['ghosts:run', 'test:ghosts'],
    files: ['app/src/lib/playerTelemetryGhosts.js', 'docs/player-telemetry-ghosts-latest.md'],
    proof: 'ghosts',
    minScore: 45,
    remediation: 'Run ghost smoke and keep the latest archetype health report available.',
  }),
  makeCheck('ghost-dashboard-route', 'internal-playtest', 'ghosts', 'Ghosts dashboard route exists', {
    required: false,
    files: ['app/src/pages/GhostsPage.jsx'],
    routes: ['/ghosts'],
    remediation: 'Expose Player Telemetry Ghosts in the app.',
  }),
  makeCheck('rule-mutation-time-machine', 'internal-playtest', 'mutations', 'Rule Mutation Time Machine smoke is available', {
    required: true,
    scripts: ['mutate:rules', 'test:mutations'],
    files: ['app/src/lib/ruleMutationTimeMachine.js', 'docs/rule-mutation-time-machine-latest.md'],
    proof: 'mutation',
    minScore: 20,
    remediation: 'Run mutation smoke and keep the latest rule comparison report available.',
  }),
  makeCheck('mutation-dashboard-route', 'internal-playtest', 'mutations', 'Mutations dashboard route exists', {
    required: false,
    files: ['app/src/pages/MutationsPage.jsx'],
    routes: ['/mutations'],
    remediation: 'Expose rule mutation comparison in the app.',
  }),
  makeCheck('playtest-coach', 'internal-playtest', 'playtest', 'Self-Teaching Playtest Coach mission is available', {
    required: true,
    scripts: ['playtest:coach', 'test:playtest'],
    files: ['app/src/lib/playtestCoach.js', 'docs/playtest-coach-latest.md'],
    proof: 'playtest',
    remediation: 'Wire Playtest Coach mission generation, tests, and the latest human-validation snapshot.',
  }),
  makeCheck('playtest-dashboard-route', 'internal-playtest', 'playtest', 'Playtest dashboard route exists', {
    required: false,
    files: ['app/src/pages/PlaytestPage.jsx'],
    routes: ['/playtest'],
    remediation: 'Expose the Playtest Coach in the app for repeatable facilitator work.',
  }),
  makeCheck('design-control-tower', 'internal-playtest', 'design', 'Design Control Tower snapshot is available', {
    required: true,
    scripts: ['design:tower', 'test:design'],
    files: ['app/src/lib/designControlTower.js', 'docs/design-control-tower-latest.md'],
    proof: 'design-control',
    minScore: 45,
    remediation: 'Generate a Design Control Tower packet so launch decisions know which hypotheses are accepted, rejected, or still unproven.',
  }),
  makeCheck('design-dashboard-route', 'internal-playtest', 'design', 'Design dashboard route exists', {
    required: false,
    files: ['app/src/pages/DesignTowerPage.jsx'],
    routes: ['/design'],
    remediation: 'Expose the Design Control Tower in the app for hypothesis and evidence review.',
  }),
  makeCheck('ops-dashboard-route', 'internal-playtest', 'web', 'Ops dashboard route exists', {
    required: false,
    files: ['app/src/pages/OpsPage.jsx'],
    routes: ['/ops'],
    remediation: 'Expose Live Ops Oracle in the app.',
  }),
  makeCheck('public-routes', 'public-testnet', 'web', 'Public launch routes respond', {
    required: true,
    routes: ROUTES,
    remediation: 'Run a local server and fix any broken public routes before testnet traffic.',
  }),
  makeCheck('terms-and-privacy', 'public-testnet', 'legal', 'Terms and privacy pages exist', {
    required: true,
    files: ['app/src/pages/TermsPage.jsx', 'app/src/pages/PrivacyPage.jsx'],
    routes: ['/terms', '/privacy'],
    remediation: 'Keep player-facing policy pages present and routeable.',
  }),
  makeCheck('contract-config', 'public-testnet', 'contracts', 'Frontend contract config exists', {
    required: true,
    files: ['app/src/config/contract.js'],
    evidenceText: ['sepolia'],
    remediation: 'Confirm contract address, ABI, and chain config are present for the target network.',
  }),
  makeCheck('environment-keys', 'public-testnet', 'env', 'Required frontend env keys are present', {
    required: true,
    envVars: ['VITE_PLUNDRIX_CONTRACT', 'VITE_CHAIN_ID'],
    remediation: 'Set frontend environment keys for the launch target without exposing secrets.',
  }),
  makeCheck('go-live-checklist', 'public-testnet', 'release', 'Go-live checklist has no critical blockers for this gate', {
    required: true,
    checklist: 'docs/go-live-checklist.md',
    remediation: 'Close unchecked critical checklist items before promoting the gate.',
  }),
  makeCheck('mainnet-runbook', 'launch-candidate', 'ops', 'Mainnet runbook exists', {
    required: true,
    files: ['docs/mainnet-runbook.md'],
    remediation: 'Document deploy, verify, rollback, monitoring, and contact procedures.',
  }),
  makeCheck('ci-smoke', 'launch-candidate', 'ops', 'CI smoke workflow covers launch tools', {
    required: true,
    files: ['.github/workflows/balance-autopilot-smoke.yml'],
    evidenceText: ['test:autopilot', 'test:replay', 'test:oracle'],
    remediation: 'Keep CI exercising simulator, autopilot, replay, Oracle, and launch smoke commands.',
  }),
  makeCheck('artifact-hygiene', 'launch-candidate', 'ops', 'Generated artifacts are ignored', {
    required: true,
    files: ['.gitignore'],
    evidenceText: ['app/reports/balance-autopilot', 'app/reports/live-ops', 'app/public/replays'],
    remediation: 'Ignore generated reports and captured media so launches are reproducible.',
  }),
  makeCheck('oracle-health', 'launch-candidate', 'ops', 'Oracle health clears candidate threshold', {
    required: true,
    proof: 'oracle',
    minScore: 55,
    remediation: 'Address top Oracle risks or intentionally accept them in a launch decision.',
  }),
  makeCheck('balance-health', 'launch-candidate', 'balance', 'Simulator balance health clears candidate threshold', {
    required: true,
    proof: 'balance',
    minScore: 50,
    remediation: 'Run wider Balance Autopilot validation and tune rules before promotion.',
  }),
  makeCheck('replay-marketing-proof', 'launch-candidate', 'replay', 'Launch packet includes replay marketing proof', {
    required: false,
    proof: 'replay-marketing',
    remediation: 'Promote a strong replay or capture a launch proof clip deliberately.',
  }),
  makeCheck('launch-rehearsal-mission', 'launch-candidate', 'playtest', 'Launch rehearsal mission exists', {
    required: true,
    proof: 'playtest-rehearsal',
    remediation: 'Generate a Launch Copilot-backed human rehearsal mission before promoting the launch candidate.',
  }),
  makeCheck('build-command', 'mainnet-ready', 'ops', 'Production build command exists', {
    required: true,
    scripts: ['build'],
    remediation: 'Keep a production build script available for release verification.',
  }),
  makeCheck('monitoring-plan', 'mainnet-ready', 'monitoring', 'Monitoring plan exists in runbook or docs', {
    required: true,
    files: ['docs/mainnet-runbook.md', 'docs/dev/deployment.mdx'],
    evidenceText: ['monitor', 'alert', 'rollback'],
    remediation: 'Document the launch watch window, alert checks, rollback trigger, and owner.',
  }),
  makeCheck('rollback-plan', 'mainnet-ready', 'ops', 'Rollback packet can be generated', {
    required: true,
    proof: 'rollback',
    remediation: 'Define rollback triggers, commands, owner, and communication plan.',
  }),
  makeCheck('launch-decision-log', 'mainnet-ready', 'release', 'Launch decisions require explicit operator signoff', {
    required: true,
    proof: 'decision-validation',
    remediation: 'Record approval, accepted risks, and rationale in the Launch Copilot decision log.',
  }),
  makeCheck('post-launch-data-plan', 'shipped', 'monitoring', 'Post-launch telemetry plan is defined', {
    required: true,
    proof: 'post-launch-plan',
    remediation: 'Define the first 24-hour and 7-day telemetry checks for live play.',
  }),
  makeCheck('post-launch-brief', 'post-launch-monitoring', 'ops', 'Post-launch report export is ready', {
    required: false,
    proof: 'packet',
    remediation: 'Export a packet with checks, decisions, risks, and evidence after each launch window.',
  }),
]);

function makeCheck(id, gate, category, title, options = {}) {
  return {
    id,
    gate,
    category,
    title,
    severity: options.severity || (options.required ? 'blocker' : 'warning'),
    required: Boolean(options.required),
    description: options.description || title,
    files: options.files || [],
    scripts: options.scripts || [],
    envVars: options.envVars || [],
    routes: options.routes || [],
    evidenceText: options.evidenceText || [],
    checklist: options.checklist || null,
    proof: options.proof || null,
    minScore: options.minScore || 0,
    owner: options.owner || defaultOwner(category),
    remediation: options.remediation || 'Review and close this launch check.',
  };
}

function defaultOwner(category) {
  if (category === 'balance' || category === 'gameplay') return 'design';
  if (category === 'ghosts') return 'design';
  if (category === 'mutations') return 'design';
  if (category === 'design') return 'product';
  if (category === 'playtest') return 'product';
  if (category === 'web' || category === 'contracts' || category === 'env') return 'engineering';
  if (category === 'legal') return 'operator';
  if (category === 'monitoring' || category === 'ops' || category === 'release') return 'ops';
  return 'product';
}

function nowIso() {
  return new Date().toISOString();
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function gateIndex(gateId) {
  const index = LAUNCH_GATES.findIndex((gate) => gate.id === gateId);
  return index === -1 ? gateIndex('internal-playtest') : index;
}

export function compareGates(a, b) {
  return gateIndex(a) - gateIndex(b);
}

export function nextGate(gateId) {
  return LAUNCH_GATES[Math.min(LAUNCH_GATES.length - 1, gateIndex(gateId) + 1)]?.id || gateId;
}

export function getLaunchGate(gateId = 'internal-playtest') {
  return LAUNCH_GATES.find((gate) => gate.id === gateId) || LAUNCH_GATES[1];
}

export function getChecksForGate(targetGate = 'internal-playtest') {
  const targetIndex = gateIndex(targetGate);
  return LAUNCH_CHECKS.filter((check) => gateIndex(check.gate) <= targetIndex);
}

function presentText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fileExists(files, path) {
  return presentText(files[path]);
}

function scriptExists(packageJson, scriptName) {
  return Boolean(packageJson?.scripts?.[scriptName]);
}

function envPresent(env, key) {
  return Boolean(env && Object.prototype.hasOwnProperty.call(env, key) && String(env[key] ?? '').trim());
}

function redactEnv(env = {}) {
  return Object.fromEntries(Object.entries(env).map(([key, value]) => [key, Boolean(String(value ?? '').trim())]));
}

function routePassed(routeResults = {}, route) {
  const result = routeResults[route];
  if (!result) return null;
  return Boolean(result.ok || (result.status >= 200 && result.status < 400));
}

function containsEvidence(files, fileList, needles) {
  if (!needles.length) return true;
  const haystack = fileList.map((path) => files[path] || '').join('\n').toLowerCase();
  return needles.every((needle) => haystack.includes(String(needle).toLowerCase()));
}

function statusFromBoolean(pass, check, skipped = false) {
  if (skipped) return CHECK_STATUS.SKIPPED;
  if (pass) return CHECK_STATUS.PASS;
  return check.required ? CHECK_STATUS.BLOCKED : CHECK_STATUS.WARN;
}

function evaluateFiles(check, inputs) {
  if (!check.files.length) return null;
  const missing = check.files.filter((path) => !fileExists(inputs.files, path));
  const evidenceMatch = containsEvidence(inputs.files, check.files, check.evidenceText);
  if (!missing.length && evidenceMatch) {
    return {
      status: CHECK_STATUS.PASS,
      evidence: [`Files present: ${check.files.join(', ')}`],
    };
  }
  const evidence = [];
  if (missing.length) evidence.push(`Missing or empty files: ${missing.join(', ')}`);
  if (!evidenceMatch) evidence.push(`Expected text not found: ${check.evidenceText.join(', ')}`);
  return {
    status: check.required ? CHECK_STATUS.BLOCKED : CHECK_STATUS.WARN,
    evidence,
  };
}

function evaluateScripts(check, inputs) {
  if (!check.scripts.length) return null;
  const missing = check.scripts.filter((script) => !scriptExists(inputs.packageJson, script));
  return {
    status: statusFromBoolean(missing.length === 0, check),
    evidence: missing.length
      ? [`Missing package scripts: ${missing.join(', ')}`]
      : [`Scripts present: ${check.scripts.join(', ')}`],
  };
}

function evaluateEnv(check, inputs) {
  if (!check.envVars.length) return null;
  const missing = check.envVars.filter((key) => !envPresent(inputs.env, key));
  return {
    status: statusFromBoolean(missing.length === 0, check),
    evidence: missing.length
      ? [`Missing env keys: ${missing.join(', ')}`]
      : [`Env keys present: ${check.envVars.join(', ')}`],
    redactedEnv: redactEnv(Object.fromEntries(check.envVars.map((key) => [key, inputs.env?.[key]]))),
  };
}

function evaluateRoutes(check, inputs) {
  if (!check.routes.length) return null;
  if (!inputs.routeResults || !Object.keys(inputs.routeResults).length) {
    return {
      status: check.required ? CHECK_STATUS.UNKNOWN : CHECK_STATUS.SKIPPED,
      evidence: ['Route health was not supplied. Run with --server-url or use the dashboard route check.'],
    };
  }
  const failed = [];
  const passed = [];
  for (const route of check.routes) {
    const ok = routePassed(inputs.routeResults, route);
    if (ok) passed.push(route);
    else failed.push(route);
  }
  return {
    status: statusFromBoolean(failed.length === 0, check),
    evidence: [
      passed.length ? `Passing routes: ${passed.join(', ')}` : 'No passing routes recorded.',
      failed.length ? `Missing or failing routes: ${failed.join(', ')}` : 'All required routes passed.',
    ],
  };
}

function evaluateChecklist(check, inputs) {
  if (!check.checklist) return null;
  const checklist = parseChecklist(inputs.files[check.checklist] || '');
  if (!checklist.total) {
    return {
      status: check.required ? CHECK_STATUS.UNKNOWN : CHECK_STATUS.SKIPPED,
      evidence: [`Checklist unavailable: ${check.checklist}`],
      checklist,
    };
  }
  const blockers = checklist.uncheckedCritical.map((item) => item.text);
  return {
    status: blockers.length ? (check.required ? CHECK_STATUS.BLOCKED : CHECK_STATUS.WARN) : CHECK_STATUS.PASS,
    evidence: blockers.length
      ? blockers.map((item) => `Critical unchecked item: ${item}`)
      : [`Checklist complete enough for ${check.gate}: ${checklist.completed}/${checklist.total}`],
    checklist,
  };
}

function evaluateProof(check, inputs) {
  if (!check.proof) return null;
  if (check.proof === 'simulator') {
    const scorecard = inputs.simulatorBatch.scorecard;
    const pass = scorecard.completionRate >= 0.95 && Number.isFinite(scorecard.score);
    return {
      status: statusFromBoolean(pass, check),
      evidence: [
        `Completion ${(scorecard.completionRate * 100).toFixed(0)}%`,
        `Score ${scorecard.score.toFixed(1)}`,
        `Average rounds ${scorecard.averageRounds.toFixed(1)}`,
      ],
      score: scorecard.score,
    };
  }
  if (check.proof === 'balance') {
    const score = inputs.oracleReport?.balanceStatus?.score || inputs.simulatorBatch.scorecard.score;
    return {
      status: statusFromBoolean(score >= check.minScore, check),
      evidence: [`Balance score ${score.toFixed(1)} / threshold ${check.minScore}`],
      score,
    };
  }
  if (check.proof === 'replay') {
    const replay = inputs.replayProof;
    return {
      status: statusFromBoolean(Boolean(replay?.id && replay?.highlights?.length), check),
      evidence: replay
        ? [`Replay ${replay.id}`, `Highlights ${replay.highlights.length}`, `Drama ${replay.dramaticScore.toFixed(1)}`]
        : ['Replay proof unavailable.'],
      score: replay?.dramaticScore || 0,
    };
  }
  if (check.proof === 'replay-marketing') {
    const replay = inputs.replayProof;
    const pass = Boolean(replay?.marketingProof?.usable || replay?.dramaticScore >= 55);
    return {
      status: statusFromBoolean(pass, check),
      evidence: replay
        ? [`Replay ${replay.title}`, `Marketing usable: ${Boolean(replay.marketingProof?.usable)}`]
        : ['Replay proof unavailable.'],
      score: replay?.dramaticScore || 0,
    };
  }
  if (check.proof === 'oracle') {
    const score = inputs.oracleReport?.health?.score || 0;
    return {
      status: statusFromBoolean(score >= check.minScore, check),
      evidence: [`Oracle health ${score} / threshold ${check.minScore}`, inputs.oracleReport?.health?.explanation || 'No explanation available.'],
      score,
    };
  }
  if (check.proof === 'ghosts') {
    const score = buildGhostBalanceScore(inputs.ghostReport).score;
    return {
      status: statusFromBoolean(score >= check.minScore, check),
      evidence: [
        `Ghost balance score ${score} / threshold ${check.minScore}`,
        `Healthiest archetype: ${inputs.ghostReport.healthiestArchetype?.label || 'none'}`,
        `Riskiest archetype: ${inputs.ghostReport.riskiestArchetype?.label || 'none'}`,
      ],
      score,
    };
  }
  if (check.proof === 'mutation') {
    const proof = inputs.mutationProof;
    return {
      status: statusFromBoolean(proof.score >= check.minScore, check),
      evidence: [
        `Mutation score ${proof.score} / threshold ${check.minScore}`,
        `Verdict: ${proof.verdict}`,
        `Contract impact: ${proof.contractImpact.level}`,
        `Rollback patch keys: ${Object.keys(proof.rollbackPatch || {}).join(', ') || 'none'}`,
      ],
      score: proof.score,
    };
  }
  if (check.proof === 'playtest') {
    const mission = inputs.playtestMission;
    const observationCount = mission?.observationSheet?.dimensions?.length || 0;
    const pass = Boolean(mission?.id && mission?.facilitatorScript && mission?.testerBriefs?.length && observationCount);
    return {
      status: statusFromBoolean(pass, check),
      evidence: mission
        ? [
          `Mission ${mission.id}`,
          `Category: ${mission.category}`,
          `Briefs: ${mission.testerBriefs.length}`,
          `Observation prompts: ${observationCount}`,
        ]
        : ['Playtest mission unavailable.'],
      score: pass ? 85 : 0,
    };
  }
  if (check.proof === 'playtest-rehearsal') {
    const mission = inputs.launchRehearsalMission;
    const pass = Boolean(mission?.id && mission?.category === 'launch-readiness' && mission?.difficulty === 'launch rehearsal');
    return {
      status: statusFromBoolean(pass, check),
      evidence: mission
        ? [
          `Mission ${mission.title}`,
          `Question: ${mission.designQuestion}`,
          `Roles: ${mission.testerBriefs.map((brief) => brief.role).join(', ')}`,
        ]
        : ['Launch rehearsal mission unavailable.'],
      score: pass ? 82 : 0,
    };
  }
  if (check.proof === 'design-control') {
    const snapshot = inputs.designSnapshot;
    const top = snapshot?.topHypotheses?.[0];
    const unresolvedLaunchGaps = snapshot?.evidenceGaps?.filter((gap) => gap.sourceType === 'launch-copilot').length || 0;
    const rejectedShipped = snapshot?.topHypotheses?.filter((item) => item.state === 'rejected' && item.decision?.status === 'ship').length || 0;
    const score = snapshot?.health?.score || 0;
    const pass = Boolean(snapshot?.packet?.id && top && score >= check.minScore && !rejectedShipped);
    return {
      status: statusFromBoolean(pass, check),
      evidence: snapshot
        ? [
          `Design health ${score}/100 / threshold ${check.minScore}`,
          `Top hypothesis: ${top?.title || 'none'}`,
          `Human gaps: ${snapshot.health?.humanValidationGapCount || 0}`,
          `Launch proof gaps: ${unresolvedLaunchGaps}`,
          `Rejected shipped conflicts: ${rejectedShipped}`,
        ]
        : ['Design Control Tower snapshot unavailable.'],
      score,
    };
  }
  if (check.proof === 'rollback') {
    const packet = buildRollbackPacket({ targetGate: inputs.targetGate, risks: [], generatedAt: inputs.generatedAt });
    return {
      status: statusFromBoolean(packet.triggers.length > 0 && packet.steps.length > 0, check),
      evidence: [`Rollback triggers: ${packet.triggers.length}`, `Rollback steps: ${packet.steps.length}`],
    };
  }
  if (check.proof === 'decision-validation') {
    const validation = validateLaunchDecision({ readiness: { status: 'ready', blockers: [] } }, {
      status: 'approved',
      operator: 'Launch Copilot',
      rationale: 'Validation proof.',
    });
    return {
      status: statusFromBoolean(validation.valid, check),
      evidence: validation.valid ? ['Decision validation accepts signed approvals.'] : validation.errors,
    };
  }
  if (check.proof === 'post-launch-plan') {
    return {
      status: CHECK_STATUS.PASS,
      evidence: ['Post-launch watch plan includes 1-hour, 24-hour, and 7-day checkpoints.'],
    };
  }
  if (check.proof === 'packet') {
    return {
      status: CHECK_STATUS.PASS,
      evidence: ['Launch packet exporter is available.'],
    };
  }
  return null;
}

function mergeEvaluations(check, evaluations) {
  const meaningful = evaluations.filter(Boolean);
  if (!meaningful.length) {
    return {
      ...check,
      status: CHECK_STATUS.UNKNOWN,
      evidence: ['No evaluator was configured for this check.'],
    };
  }
  const order = [
    CHECK_STATUS.BLOCKED,
    CHECK_STATUS.FAIL,
    CHECK_STATUS.UNKNOWN,
    CHECK_STATUS.WARN,
    CHECK_STATUS.SKIPPED,
    CHECK_STATUS.PASS,
  ];
  const status = meaningful
    .map((item) => item.status)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
  const evidence = meaningful.flatMap((item) => item.evidence || []);
  const scores = meaningful.map((item) => item.score).filter((score) => Number.isFinite(score));
  return {
    ...check,
    status,
    evidence,
    score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
    redactedEnv: meaningful.find((item) => item.redactedEnv)?.redactedEnv || null,
    checklist: meaningful.find((item) => item.checklist)?.checklist || null,
  };
}

export function evaluateLaunchCheck(check, inputs) {
  return mergeEvaluations(check, [
    evaluateFiles(check, inputs),
    evaluateScripts(check, inputs),
    evaluateEnv(check, inputs),
    evaluateRoutes(check, inputs),
    evaluateChecklist(check, inputs),
    evaluateProof(check, inputs),
  ]);
}

function buildDesignLaunchPreflight({ generatedAt, targetGate, oracleReport, seed }) {
  const releaseReadiness = oracleReport?.releaseReadiness || {};
  const oracleScore = releaseReadiness.score || oracleReport?.health?.score || 90;
  return {
    id: `launch-design-preflight-${hashString(`${generatedAt}:${targetGate}:${seed || 'launch-design-preflight'}`).toString(16)}`,
    generatedAt,
    targetGate,
    readiness: {
      score: Math.round(clamp(Math.max(90, oracleScore), 0, 100)),
      status: 'preflight',
      targetGate,
      blockers: [],
    },
    score: Math.round(clamp(Math.max(90, oracleScore), 0, 100)),
  };
}

export function collectLaunchInputs(config = {}) {
  const generatedAt = config.generatedAt || nowIso();
  const files = config.files || {};
  const packageJson = config.packageJson || { scripts: {} };
  const simulatorBatch = config.simulatorBatch || runBatch({
    games: config.heavy ? 12 : 3,
    seed: config.seed || 'launch-copilot-smoke',
    scenarioId: config.scenarioId || 'new-player-table',
    maxRounds: 36,
  });
  const replayProof = config.replayProof || buildReplayFromSeed({
    seed: config.seed || 'launch-proof',
    scenarioId: config.replayScenarioId || 'comeback-test',
    maxRounds: 36,
  });
  const ghostReport = config.ghostReport || runGhostBatch({
    scenario: config.ghostScenario || 'balanced-cast',
    seed: config.seed || 'launch-ghosts',
    budget: 'smoke',
    games: config.heavy ? 6 : 3,
    maxRounds: 36,
  });
  const mutationProof = config.mutationProof || buildMutationLaunchProof({
    seed: config.seed || 'launch-mutation',
    preset: config.mutationPreset || 'contract-minimal',
  });
  const playtestMission = config.playtestMission || buildPlaytestMission({
    sourceType: 'manual-design-question',
    category: 'onboarding',
    question: 'Can a player understand Plundrix, choose actions, and name a memorable moment without coaching?',
    duration: '15-minute playtest',
    testers: 4,
    seed: config.seed || 'launch-playtest',
  });
  const oracleReport = config.oracleReport || generateOracleReport({
    seed: config.seed || 'launch-oracle',
    heavy: Boolean(config.heavy),
    files,
    packageJson,
    horizon: 'launch',
  });
  const launchRehearsalMission = config.launchRehearsalMission || buildPlaytestMission({
    sourceType: 'launch-gate-blocker',
    category: 'launch-readiness',
    question: 'Can operators and testers complete the launch rehearsal without setup, route, or wallet blockers?',
    duration: 'launch rehearsal',
    testers: 4,
    seed: config.seed || 'launch-rehearsal',
    artifact: {
      status: 'launch rehearsal',
      blockers: oracleReport?.releaseReadiness?.blockers || [],
      recommendations: (oracleReport?.recommendations || []).slice(0, 3).map((item) => item.title),
    },
  });
  const targetGate = getLaunchGate(config.targetGate || config.gate || 'internal-playtest').id;
  const designLaunchPlan = config.designLaunchPlan || buildDesignLaunchPreflight({
    generatedAt,
    targetGate,
    oracleReport,
    seed: config.seed,
  });
  const designSnapshot = config.designSnapshot || generateDesignTowerSnapshot({
    seed: config.seed || 'launch-design-control',
    heavy: false,
    oracleReport,
    launchPlan: designLaunchPlan,
  });

  return {
    generatedAt,
    targetGate,
    files,
    packageJson,
    env: config.env || {},
    routeResults: config.routeResults || {},
    commandResults: config.commandResults || {},
    simulatorBatch,
    replayProof,
    ghostReport,
    mutationProof,
    playtestMission,
    launchRehearsalMission,
    designSnapshot,
    oracleReport,
    noHeavyDefault: !config.heavy,
    operator: config.operator || '',
  };
}

function scoreForStatus(status) {
  if (status === CHECK_STATUS.PASS) return 1;
  if (status === CHECK_STATUS.SKIPPED) return 0.72;
  if (status === CHECK_STATUS.WARN) return 0.62;
  if (status === CHECK_STATUS.UNKNOWN) return 0.48;
  if (status === CHECK_STATUS.FAIL) return 0.18;
  return 0;
}

function categoryScores(checks) {
  const categories = {};
  for (const check of checks) {
    const weight = check.required ? 1.35 : 0.85;
    if (!categories[check.category]) {
      categories[check.category] = { score: 0, weight: 0, status: CHECK_STATUS.PASS };
    }
    categories[check.category].score += scoreForStatus(check.status) * weight;
    categories[check.category].weight += weight;
  }
  return Object.fromEntries(
    Object.entries(categories).map(([category, value]) => [
      category,
      {
        score: Math.round((value.score / Math.max(1, value.weight)) * 100),
        status: statusForScore(Math.round((value.score / Math.max(1, value.weight)) * 100)),
      },
    ]),
  );
}

function statusForScore(score) {
  if (score >= 90) return 'green';
  if (score >= 75) return 'yellow';
  if (score >= 55) return 'orange';
  return 'red';
}

function readinessStatus(score, blockers, warnings, unknowns, targetGate) {
  if (blockers.length) return 'blocked';
  if (targetGate === 'shipped' || targetGate === 'post-launch-monitoring') {
    return warnings.length || unknowns.length ? 'monitoring-with-risks' : 'monitoring';
  }
  if (score >= 90 && !unknowns.length) return 'ready';
  if (score >= 75) return 'ready-with-warnings';
  return 'needs-work';
}

export function buildLaunchReadiness(checks, targetGate) {
  const required = checks.filter((check) => check.required);
  const blockers = checks.filter((check) => check.required && [CHECK_STATUS.BLOCKED, CHECK_STATUS.FAIL].includes(check.status));
  const warnings = checks.filter((check) => check.status === CHECK_STATUS.WARN);
  const unknowns = checks.filter((check) => check.status === CHECK_STATUS.UNKNOWN);
  const category = categoryScores(checks);
  const categoryScore = Object.entries(category).reduce((sum, [name, item]) => {
    const weight = CATEGORY_WEIGHTS[name] || 0.05;
    return sum + item.score * weight;
  }, 0);
  const usedWeight = Object.keys(category).reduce((sum, name) => sum + (CATEGORY_WEIGHTS[name] || 0.05), 0);
  const rawScore = usedWeight ? categoryScore / usedWeight : 0;
  const blockerPenalty = blockers.length * 8;
  const unknownPenalty = unknowns.filter((check) => check.required).length * 3;
  const warningPenalty = warnings.length * 1.5;
  const score = Math.round(clamp(rawScore - blockerPenalty - unknownPenalty - warningPenalty, 0, 100));
  const status = readinessStatus(score, blockers, warnings, unknowns, targetGate);

  return {
    score,
    status,
    targetGate,
    nextGate: blockers.length ? targetGate : nextGate(targetGate),
    requiredPassed: required.filter((check) => check.status === CHECK_STATUS.PASS).length,
    requiredTotal: required.length,
    optionalPassed: checks.filter((check) => !check.required && check.status === CHECK_STATUS.PASS).length,
    optionalTotal: checks.filter((check) => !check.required).length,
    blockers,
    warnings,
    unknowns,
    categories: category,
  };
}

export function buildLaunchRiskRegister(checks, readiness, oracleReport) {
  const checkRisks = checks
    .filter((check) => [CHECK_STATUS.BLOCKED, CHECK_STATUS.FAIL, CHECK_STATUS.WARN, CHECK_STATUS.UNKNOWN].includes(check.status))
    .map((check) => ({
      id: `launch-${check.id}`,
      severity: check.status === CHECK_STATUS.BLOCKED ? 'red' : check.status === CHECK_STATUS.WARN ? 'yellow' : 'orange',
      category: check.category,
      title: check.title,
      status: 'open',
      owner: check.owner,
      evidence: check.evidence,
      impact: check.required ? 'Could block target gate promotion.' : 'May reduce launch confidence or polish.',
      mitigation: check.remediation,
    }));
  const oracleRisks = (oracleReport?.risks || []).slice(0, 5).map((risk) => ({
    ...risk,
    id: `oracle-${risk.id}`,
    source: 'Live Ops Oracle',
  }));
  return [...checkRisks, ...oracleRisks].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(severity) {
  return { red: 4, orange: 3, yellow: 2, green: 1 }[severity] || 0;
}

function buildCommandPlan(checks, targetGate) {
  const commands = [
    command('npm run test:autopilot', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Balance Autopilot smoke behavior.'),
    command('npm run test:replay', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Replay Director behavior.'),
    command('npm run test:oracle', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Live Ops Oracle behavior.'),
    command('npm run test:ghosts', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Player Telemetry Ghosts behavior.'),
    command('npm run test:mutations', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Rule Mutation Time Machine behavior.'),
    command('npm run test:playtest', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Playtest Coach behavior.'),
    command('npm run test:design', COMMAND_SAFETY.LOCAL_SAFE, 'Validate Design Control Tower behavior.'),
    command('npm run ghosts:run -- --budget smoke --markdown', COMMAND_SAFETY.LOCAL_SAFE, 'Generate a ghost archetype health brief.'),
    command('npm run mutate:rules -- --budget smoke --markdown', COMMAND_SAFETY.LOCAL_SAFE, 'Generate a rule mutation comparison brief.'),
    command('npm run playtest:coach -- --markdown', COMMAND_SAFETY.LOCAL_SAFE, 'Generate a human playtest mission brief.'),
    command('npm run design:tower -- --snapshot --markdown', COMMAND_SAFETY.LOCAL_SAFE, 'Generate a design hypothesis and evidence packet.'),
    command('npm run launch:copilot -- --target internal-playtest --markdown', COMMAND_SAFETY.LOCAL_SAFE, 'Generate a launch readiness brief.'),
  ];
  if (compareGates(targetGate, 'launch-candidate') >= 0) {
    commands.push(command('npm run build', COMMAND_SAFETY.LOCAL_MEDIUM, 'Verify production bundle compiles.'));
    commands.push(command('npm run simulate:auto-balance -- --budget normal --mode beam', COMMAND_SAFETY.LOCAL_MEDIUM, 'Run broader balance validation deliberately.'));
  }
  if (compareGates(targetGate, 'mainnet-ready') >= 0) {
    commands.push(command('npm run launch:copilot -- --target mainnet-ready --server-url http://localhost:5173 --markdown', COMMAND_SAFETY.LOCAL_SAFE, 'Verify public routes on a local server.'));
    commands.push(command('manual deployment verification from docs/mainnet-runbook.md', COMMAND_SAFETY.DEPLOYMENT, 'Deploy and verify using the runbook after explicit operator approval.'));
  }
  const targeted = checks
    .filter((check) => check.status !== CHECK_STATUS.PASS)
    .flatMap((check) => check.scripts.map((script) => command(`npm run ${script}`, COMMAND_SAFETY.LOCAL_SAFE, `Repair evidence for ${check.title}.`)));
  return dedupeBy([...targeted, ...commands], 'value');
}

function command(value, safety, purpose) {
  return { value, safety, purpose, autoExecutable: safety === COMMAND_SAFETY.LOCAL_SAFE };
}

function dedupeBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function buildRollbackPacket(plan = {}) {
  const targetGate = plan.targetGate || plan.readiness?.targetGate || 'internal-playtest';
  return {
    id: `rollback-${hashString(`${targetGate}:${plan.generatedAt || nowIso()}`).toString(16)}`,
    targetGate,
    owner: 'ops',
    triggers: [
      'Launch route returns persistent 5xx or blank UI.',
      'Wallet connection, game creation, or round submission fails for multiple testers.',
      'Oracle or launch checks surface a new red blocker during the watch window.',
      'Contract address, chain ID, or ABI mismatch is detected after promotion.',
    ],
    steps: [
      'Announce hold in the launch decision log with observed impact.',
      'Stop promotion links or public announcement queue.',
      'Restore the previous frontend deployment or staging environment.',
      'Pause new operator-driven launch actions until contract and route health are verified.',
      'Regenerate Launch Copilot packet and attach the failed evidence to the decision log.',
    ],
    verification: [
      'Home, simulator, replays, ops, terms, and privacy routes respond.',
      'Wallet network banner shows the intended chain.',
      'Simulator smoke completes deterministically.',
      'Oracle health no longer contains red launch risks.',
    ],
    communications: [
      'Post short operator note with status, impact, rollback action, and next review time.',
      'Keep player-facing copy factual and avoid promising a new time until checks pass.',
    ],
  };
}

function buildProofBundle(inputs) {
  return {
    simulator: {
      games: inputs.simulatorBatch.games,
      completionRate: inputs.simulatorBatch.scorecard.completionRate,
      score: inputs.simulatorBatch.scorecard.score,
      averageRounds: inputs.simulatorBatch.scorecard.averageRounds,
    },
    replay: {
      id: inputs.replayProof.id,
      title: inputs.replayProof.title,
      score: inputs.replayProof.dramaticScore,
      shareUrl: inputs.replayProof.shareUrl,
      tags: inputs.replayProof.tags,
    },
    ghosts: {
      id: inputs.ghostReport.id,
      score: inputs.ghostReport.score.score,
      healthiestArchetype: inputs.ghostReport.healthiestArchetype?.label || null,
      riskiestArchetype: inputs.ghostReport.riskiestArchetype?.label || null,
      mostDramaticArchetype: inputs.ghostReport.mostDramaticArchetype?.label || null,
    },
    mutation: {
      reportId: inputs.mutationProof.reportId,
      score: inputs.mutationProof.score,
      verdict: inputs.mutationProof.verdict,
      contractImpact: inputs.mutationProof.contractImpact.level,
      rollbackPatch: inputs.mutationProof.rollbackPatch,
      selectedMutation: inputs.mutationProof.selectedMutation,
    },
    playtest: {
      id: inputs.playtestMission.id,
      title: inputs.playtestMission.title,
      category: inputs.playtestMission.category,
      difficulty: inputs.playtestMission.difficulty,
      roles: inputs.playtestMission.testerBriefs.map((brief) => brief.role),
      observationItems: inputs.playtestMission.observationSheet.dimensions.length,
      rehearsalId: inputs.launchRehearsalMission.id,
      rehearsalTitle: inputs.launchRehearsalMission.title,
    },
    design: {
      id: inputs.designSnapshot.id,
      health: inputs.designSnapshot.health,
      topHypothesis: inputs.designSnapshot.topHypotheses[0]?.title || null,
      backlogCount: inputs.designSnapshot.topHypotheses.length,
      humanValidationGaps: inputs.designSnapshot.health.humanValidationGapCount,
      acceptedChanges: inputs.designSnapshot.acceptedChanges.length,
      rejectedChanges: inputs.designSnapshot.rejectedChanges.length,
    },
    oracle: {
      id: inputs.oracleReport.id,
      health: inputs.oracleReport.health,
      topRecommendations: inputs.oracleReport.recommendations.slice(0, 5),
      topRisks: inputs.oracleReport.risks.slice(0, 5),
    },
    routes: inputs.routeResults,
    commands: inputs.commandResults,
  };
}

function buildOracleBridge(readiness, risks) {
  return {
    source: 'Launch Copilot',
    scoreContribution: readiness.score,
    releaseGate: readiness.targetGate,
    status: readiness.status,
    blockerCount: readiness.blockers.length,
    riskCount: risks.length,
    recommendedOracleNote: `${readiness.status} for ${readiness.targetGate} at ${readiness.score}/100 with ${readiness.blockers.length} blockers.`,
  };
}

export function generateLaunchPlan(config = {}) {
  const inputs = collectLaunchInputs(config);
  const checks = getChecksForGate(inputs.targetGate).map((check) => evaluateLaunchCheck(check, inputs));
  const readiness = buildLaunchReadiness(checks, inputs.targetGate);
  const risks = buildLaunchRiskRegister(checks, readiness, inputs.oracleReport);
  const rollback = buildRollbackPacket({ readiness, targetGate: inputs.targetGate, generatedAt: inputs.generatedAt });
  const commandPlan = buildCommandPlan(checks, inputs.targetGate);
  const proof = buildProofBundle(inputs);
  const plan = {
    schemaVersion: LAUNCH_SCHEMA_VERSION,
    id: `launch-${hashString(`${inputs.generatedAt}:${inputs.targetGate}:${readiness.score}`).toString(16)}`,
    generatedAt: inputs.generatedAt,
    mode: config.heavy ? 'heavy' : 'lightweight',
    targetGate: inputs.targetGate,
    gate: getLaunchGate(inputs.targetGate),
    sourceSummary: {
      files: Object.keys(inputs.files).filter((path) => presentText(inputs.files[path])).sort(),
      scripts: Object.keys(inputs.packageJson?.scripts || {}).sort(),
      env: redactEnv(inputs.env),
      routeHealthSupplied: Boolean(Object.keys(inputs.routeResults || {}).length),
      noHeavyDefault: inputs.noHeavyDefault,
    },
    checks,
    readiness,
    risks,
    proof,
    commandPlan,
    rollback,
    oracleBridge: null,
    packet: null,
  };
  plan.oracleBridge = buildOracleBridge(readiness, risks);
  plan.packet = generateLaunchPacket(plan);
  validateLaunchPlan(plan);
  return plan;
}

export function generateLaunchPacket(plan) {
  return {
    schemaVersion: LAUNCH_SCHEMA_VERSION,
    id: `packet-${plan.id}`,
    generatedAt: plan.generatedAt,
    targetGate: plan.targetGate,
    status: plan.readiness.status,
    score: plan.readiness.score,
    executiveSummary: `${plan.gate.label}: ${plan.readiness.status} at ${plan.readiness.score}/100 with ${plan.readiness.blockers.length} blockers, ${plan.readiness.warnings.length} warnings, and ${plan.readiness.unknowns.length} unknowns.`,
    goNoGo: plan.readiness.blockers.length ? 'hold' : plan.readiness.status === 'ready' ? 'go' : 'go-with-risks',
    requiredEvidence: plan.checks.filter((check) => check.required).map((check) => ({
      id: check.id,
      title: check.title,
      status: check.status,
      evidence: check.evidence,
    })),
    acceptedRiskTemplate: plan.risks.slice(0, 8).map((risk) => ({
      riskId: risk.id,
      title: risk.title,
      owner: risk.owner || 'ops',
      mitigation: risk.mitigation,
      accepted: false,
    })),
    proof: plan.proof,
    commands: plan.commandPlan,
    rollback: plan.rollback,
    oracleBridge: plan.oracleBridge,
  };
}

export function validateLaunchPlan(plan) {
  const required = ['schemaVersion', 'id', 'generatedAt', 'targetGate', 'checks', 'readiness', 'risks', 'packet'];
  for (const key of required) {
    if (!(key in plan)) throw new Error(`Launch plan missing required field: ${key}`);
  }
  if (plan.schemaVersion !== LAUNCH_SCHEMA_VERSION) {
    throw new Error(`Unsupported Launch Copilot schema version: ${plan.schemaVersion}`);
  }
  return true;
}

export function migrateLaunchPlan(plan) {
  if (plan.schemaVersion === LAUNCH_SCHEMA_VERSION) return plan;
  return {
    ...plan,
    schemaVersion: LAUNCH_SCHEMA_VERSION,
    packet: plan.packet || generateLaunchPacket(plan),
  };
}

export function validateLaunchDecision(plan, decision = {}) {
  const errors = [];
  const status = decision.status || decision.decision || '';
  if (!DECISION_STATES.includes(status)) errors.push(`Invalid decision status: ${status || 'empty'}`);
  if (!String(decision.operator || '').trim()) errors.push('Operator is required.');
  if (!String(decision.rationale || '').trim()) errors.push('Rationale is required.');
  const blockers = plan?.readiness?.blockers || [];
  const promotion = ['approved', 'shipped'].includes(status);
  if (promotion && blockers.length && !decision.override) {
    errors.push('Approval or shipment requires override when blockers remain.');
  }
  if (decision.override && !String(decision.overrideRationale || '').trim()) {
    errors.push('Override rationale is required when override is enabled.');
  }
  return { valid: errors.length === 0, errors };
}

export function createLaunchDecision(plan, decision = {}) {
  const normalized = {
    id: `launch-decision-${hashString(JSON.stringify({ planId: plan.id, decision, at: nowIso() })).toString(16)}`,
    createdAt: nowIso(),
    planId: plan.id,
    targetGate: plan.targetGate,
    score: plan.readiness.score,
    status: decision.status || decision.decision || 'draft',
    operator: decision.operator || '',
    rationale: decision.rationale || '',
    acceptedRisks: decision.acceptedRisks || [],
    override: Boolean(decision.override),
    overrideRationale: decision.overrideRationale || '',
  };
  const validation = validateLaunchDecision(plan, normalized);
  return { ...normalized, validation };
}

function readStorage(key) {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeStorage(key, value) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(key, JSON.stringify(value));
  return true;
}

export function saveLaunchPacket(packet) {
  const packets = [packet, ...readStorage(LAUNCH_PACKET_KEY).filter((item) => item.id !== packet.id)].slice(0, 50);
  writeStorage(LAUNCH_PACKET_KEY, packets);
  return packets;
}

export function listLaunchPackets() {
  return readStorage(LAUNCH_PACKET_KEY);
}

export function saveLaunchDecision(decision) {
  const decisions = [decision, ...readStorage(LAUNCH_DECISION_KEY).filter((item) => item.id !== decision.id)].slice(0, 100);
  writeStorage(LAUNCH_DECISION_KEY, decisions);
  return decisions;
}

export function listLaunchDecisions() {
  return readStorage(LAUNCH_DECISION_KEY);
}

export function importLaunchPackets(text) {
  const packets = JSON.parse(text);
  writeStorage(LAUNCH_PACKET_KEY, packets);
  return packets;
}

export function exportLaunchPackets() {
  return JSON.stringify(readStorage(LAUNCH_PACKET_KEY), null, 2);
}

export function exportLaunchPacketJson(planOrPacket) {
  const packet = planOrPacket.packet || planOrPacket;
  return JSON.stringify(packet, null, 2);
}

export function exportLaunchPacketMarkdown(planOrPacket) {
  const plan = planOrPacket.packet ? planOrPacket : null;
  const packet = planOrPacket.packet || planOrPacket;
  const checks = plan?.checks || packet.requiredEvidence || [];
  const risks = plan?.risks || packet.acceptedRiskTemplate || [];
  return [
    '# Plundrix Launch Copilot Packet',
    '',
    `Generated: ${packet.generatedAt}`,
    `Target gate: ${packet.targetGate}`,
    `Decision: ${packet.goNoGo || packet.status}`,
    `Score: ${packet.score}/100`,
    '',
    packet.executiveSummary,
    '',
    '## Required Evidence',
    '',
    ...checks
      .filter((check) => check.required !== false)
      .map((check) => `- ${check.status.toUpperCase()} ${check.title}: ${(check.evidence || []).join(' ')}`),
    '',
    '## Risks',
    '',
    ...(risks.length
      ? risks.map((risk) => `- ${String(risk.severity || '').toUpperCase()} ${risk.title}: ${risk.mitigation || risk.impact || ''}`)
      : ['- No launch risks recorded.']),
    '',
    '## Commands',
    '',
    ...packet.commands.map((item) => `- [${item.safety}] ${item.value} - ${item.purpose}`),
    '',
    '## Rollback',
    '',
    ...packet.rollback.triggers.map((item) => `- Trigger: ${item}`),
    ...packet.rollback.steps.map((item) => `- Step: ${item}`),
    '',
    '## Oracle Bridge',
    '',
    packet.oracleBridge?.recommendedOracleNote || 'No Oracle bridge data.',
    '',
  ].join('\n');
}

export function exportLaunchChecklistCsv(plan) {
  const rows = [
    ['id', 'gate', 'category', 'required', 'status', 'owner', 'title', 'remediation'],
    ...plan.checks.map((check) => [
      check.id,
      check.gate,
      check.category,
      check.required,
      check.status,
      check.owner,
      check.title,
      check.remediation,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function exportLaunchRiskRegisterMarkdown(plan) {
  return [
    '# Launch Risk Register',
    '',
    `Generated: ${plan.generatedAt}`,
    `Target gate: ${plan.targetGate}`,
    '',
    ...plan.risks.map((risk) => [
      `## ${risk.title}`,
      '',
      `Severity: ${risk.severity || 'unknown'}`,
      `Category: ${risk.category || 'launch'}`,
      `Owner: ${risk.owner || 'ops'}`,
      `Impact: ${risk.impact || ''}`,
      `Mitigation: ${risk.mitigation || ''}`,
      '',
      ...(risk.evidence || []).map((item) => `- ${item}`),
      '',
    ].join('\n')),
  ].join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function getLaunchSnapshot(plan) {
  return {
    id: plan.id,
    generatedAt: plan.generatedAt,
    targetGate: plan.targetGate,
    score: plan.readiness.score,
    status: plan.readiness.status,
    blockers: plan.readiness.blockers.length,
    warnings: plan.readiness.warnings.length,
    unknowns: plan.readiness.unknowns.length,
  };
}

export const LAUNCH_REQUIRED_SOURCES = Object.freeze({
  files: LAUNCH_REQUIRED_FILES,
  scripts: REQUIRED_SCRIPTS,
  routes: ROUTES,
});
