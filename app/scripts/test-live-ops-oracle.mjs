import assert from 'node:assert/strict';
import {
  buildRecommendations,
  buildRisks,
  exportOracleMarkdown,
  exportRecommendationsCsv,
  generateOracleReport,
  parseChecklist,
  validateOracleReport,
} from '../src/lib/liveOpsOracle.js';

const checklist = parseChecklist('- [x] Done\n- [ ] Deploy contract\n- [ ] Legal review');
assert.equal(checklist.total, 3);
assert.equal(checklist.completed, 1);
assert.equal(checklist.uncheckedCritical.length, 2);

const report = generateOracleReport({
  seed: 'oracle-test',
  files: {
    '.gitignore': 'app/*.log\napp/public/replays/*.png\napp/reports/balance-autopilot/*.json\n',
    '.github/workflows/balance-autopilot-smoke.yml': 'name: smoke',
    'docs/go-live-checklist.md': '- [x] Local smoke\n- [ ] Deploy contract\n',
    'docs/dev/balance-autopilot.mdx': '# Balance Autopilot',
    'docs/dev/replay-director.mdx': '# Replay Director',
    'docs/simulator-improvement-report.md': '# Simulator',
    'docs/dev/deployment.mdx': '# Deployment',
    'docs/dev/local-dev.mdx': '# Local',
    'docs/dev/mechanics.mdx': '# Mechanics',
  },
  packageJson: {
    scripts: {
      simulate: 'node',
      'simulate:auto-balance': 'node',
      'replay:direct': 'node',
      'replay:capture': 'node',
      'test:autopilot': 'node',
      'test:replay': 'node',
    },
  },
});

validateOracleReport(report);
assert.ok(report.recommendations.length > 0, 'recommendations generated');
assert.ok(report.risks.length > 0, 'risks generated');
assert.ok(report.opportunities.length >= 0, 'opportunities generated');
assert.ok(exportOracleMarkdown(report).includes('# Plundrix Live Ops Oracle'));
assert.ok(exportRecommendationsCsv(report).includes('rank,category,title'));
assert.ok(report.releaseNotes.includes('## Added'));
assert.ok(report.marketingBundle.headlines.length > 0);

const risks = buildRisks({
  balance: { readiness: 'none', topRisks: ['none'], scoreDelta: 0 },
  replay: { marketingReadyCount: 0 },
  release: { blockers: ['Deploy contract'] },
  operations: { workflowExists: false },
  live: { connected: false, statusText: 'waiting', expectedInputs: [] },
});
assert.ok(risks.some((risk) => risk.category === 'release'));

const recs = buildRecommendations(
  {
    balance: report.balanceStatus,
    replay: report.replayStatus,
    release: report.releaseReadiness,
    operations: report.operationsStatus,
    live: report.liveDataStatus,
    marketing: report.marketingProof,
    docs: report.documentationStatus,
    simulator: report.simulatorStatus,
  },
  risks,
  [{ id: 'opp', category: 'marketing', title: 'Promote replay', evidence: [], whyNow: 'ready', action: 'npm run replay:direct' }],
);
assert.ok(recs[0].rank === 1);

console.log('Live Ops Oracle tests passed');
