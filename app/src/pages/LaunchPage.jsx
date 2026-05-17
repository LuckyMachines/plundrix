import { useMemo, useState } from 'react';
import {
  DECISION_STATES,
  LAUNCH_GATES,
  createLaunchDecision,
  exportLaunchChecklistCsv,
  exportLaunchPacketJson,
  exportLaunchPacketMarkdown,
  exportLaunchPackets,
  exportLaunchRiskRegisterMarkdown,
  generateLaunchPlan,
  importLaunchPackets,
  listLaunchDecisions,
  listLaunchPackets,
  saveLaunchDecision,
  saveLaunchPacket,
} from '../lib/launchCopilot';

const DASHBOARD_SCRIPTS = {
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
};

const DASHBOARD_FILES = {
  '.gitignore': 'app/reports/balance-autopilot/*.json\napp/reports/live-ops/*.json\napp/reports/launch/*.json\napp/public/replays/*.png\n',
  '.github/workflows/balance-autopilot-smoke.yml': 'test:autopilot test:replay test:oracle test:launch test:playtest test:design launch:copilot',
  'README.md': '# Plundrix',
  'docs/go-live-checklist.md': '- [x] Internal simulator proof\n- [x] Replay proof\n- [x] Legal review\n- [x] Launch monitoring\n',
  'docs/mainnet-runbook.md': '# Runbook\nmonitor alert rollback',
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
  'app/src/pages/TermsPage.jsx': 'TermsPage',
  'app/src/pages/PrivacyPage.jsx': 'PrivacyPage',
  'app/src/pages/SimulatorPage.jsx': 'SimulatorPage',
  'app/src/pages/ReplaysPage.jsx': 'ReplaysPage',
  'app/src/pages/OpsPage.jsx': 'OpsPage',
  'app/src/pages/GhostsPage.jsx': 'GhostsPage',
  'app/src/pages/MutationsPage.jsx': 'MutationsPage',
  'app/src/pages/PlaytestPage.jsx': 'PlaytestPage',
  'app/src/pages/DesignTowerPage.jsx': 'DesignTowerPage',
  'app/src/config/contract.js': 'sepolia',
  'app/src/lib/plundrixEngine.js': 'recommendAction runWhatIf',
  'app/src/lib/balanceAutopilot.js': 'runAutopilotSearch',
  'app/src/lib/replayDirector.js': 'buildReplayFromSeed',
  'app/src/lib/liveOpsOracle.js': 'generateOracleReport',
  'app/src/lib/playerTelemetryGhosts.js': 'runGhostBatch',
  'app/src/lib/ruleMutationTimeMachine.js': 'generateMutationReport',
  'app/src/lib/playtestCoach.js': 'buildPlaytestMission',
  'app/src/lib/designControlTower.js': 'generateDesignTowerSnapshot',
};

const PUBLIC_ROUTES = ['/', '/simulator', '/replays', '/ghosts', '/mutations', '/playtest', '/design', '/ops', '/terms', '/privacy'];

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makeEnv(contractPresent, chainPresent) {
  return {
    ...(contractPresent ? { VITE_PLUNDRIX_CONTRACT: 'present' } : {}),
    ...(chainPresent ? { VITE_CHAIN_ID: 'present' } : {}),
  };
}

export default function LaunchPage() {
  const [targetGate, setTargetGate] = useState('internal-playtest');
  const [contractPresent, setContractPresent] = useState(true);
  const [chainPresent, setChainPresent] = useState(true);
  const [routeResults, setRouteResults] = useState({});
  const [routeBusy, setRouteBusy] = useState(false);
  const [operator, setOperator] = useState('');
  const [rationale, setRationale] = useState('');
  const [decisionStatus, setDecisionStatus] = useState('draft');
  const [override, setOverride] = useState(false);
  const [overrideRationale, setOverrideRationale] = useState('');
  const [acceptedRisks, setAcceptedRisks] = useState([]);
  const [packets, setPackets] = useState(() => listLaunchPackets());
  const [decisions, setDecisions] = useState(() => listLaunchDecisions());
  const [importText, setImportText] = useState('');

  const plan = useMemo(() => generateLaunchPlan({
    targetGate,
    seed: `launch-dashboard-${targetGate}`,
    files: DASHBOARD_FILES,
    packageJson: { scripts: DASHBOARD_SCRIPTS },
    env: makeEnv(contractPresent, chainPresent),
    routeResults,
  }), [targetGate, contractPresent, chainPresent, routeResults]);

  const statusTone = statusClass(plan.readiness.status);
  const requiredPercent = Math.round((plan.readiness.requiredPassed / Math.max(1, plan.readiness.requiredTotal)) * 100);

  const runRouteChecks = async () => {
    setRouteBusy(true);
    const results = {};
    await Promise.all(PUBLIC_ROUTES.map(async (route) => {
      const started = Date.now();
      try {
        const response = await fetch(route, { cache: 'no-store' });
        results[route] = {
          ok: response.ok,
          status: response.status,
          ms: Date.now() - started,
        };
      } catch (error) {
        results[route] = {
          ok: false,
          status: 0,
          ms: Date.now() - started,
          error: error.message,
        };
      }
    }));
    setRouteResults(results);
    setRouteBusy(false);
  };

  const savePacket = () => {
    setPackets(saveLaunchPacket(plan.packet));
  };

  const importPackets = () => {
    const next = importLaunchPackets(importText);
    setPackets(next);
    setImportText('');
  };

  const toggleRisk = (riskId) => {
    setAcceptedRisks((current) => (
      current.includes(riskId)
        ? current.filter((item) => item !== riskId)
        : [...current, riskId]
    ));
  };

  const recordDecision = () => {
    const decision = createLaunchDecision(plan, {
      status: decisionStatus,
      operator,
      rationale,
      acceptedRisks,
      override,
      overrideRationale,
    });
    setDecisions(saveLaunchDecision(decision));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="label">Launch Copilot</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">Gate packet command center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              {plan.packet.executiveSummary}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
            <Metric label="Score" value={`${plan.readiness.score}/100`} tone={statusTone} />
            <Metric label="Status" value={plan.readiness.status} tone={statusTone} />
            <Metric label="Required" value={`${requiredPercent}%`} />
            <Metric label="Blockers" value={plan.readiness.blockers.length} tone={plan.readiness.blockers.length ? 'bad' : 'good'} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <select
            value={targetGate}
            onChange={(event) => setTargetGate(event.target.value)}
            className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 font-mono text-xs uppercase tracking-[0.14em] text-vault-text"
          >
            {LAUNCH_GATES.map((gate) => (
              <option key={gate.id} value={gate.id}>{gate.label}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <LaunchButton onClick={runRouteChecks} disabled={routeBusy}>{routeBusy ? 'Checking routes' : 'Check routes'}</LaunchButton>
            <LaunchButton onClick={savePacket}>Save packet</LaunchButton>
            <LaunchButton onClick={() => navigator.clipboard?.writeText(exportLaunchPacketMarkdown(plan))}>Copy packet</LaunchButton>
            <LaunchButton onClick={() => downloadText('launch-copilot.md', exportLaunchPacketMarkdown(plan), 'text/markdown')}>Markdown</LaunchButton>
            <LaunchButton onClick={() => downloadText('launch-copilot.json', exportLaunchPacketJson(plan), 'application/json')}>JSON</LaunchButton>
            <LaunchButton onClick={() => downloadText('launch-checks.csv', exportLaunchChecklistCsv(plan), 'text/csv')}>CSV</LaunchButton>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Gate controls">
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
              <span className="label">Contract env</span>
              <input
                type="checkbox"
                checked={contractPresent}
                onChange={(event) => setContractPresent(event.target.checked)}
                className="mt-3 mr-2"
              />
              VITE_PLUNDRIX_CONTRACT
            </label>
            <label className="rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
              <span className="label">Chain env</span>
              <input
                type="checkbox"
                checked={chainPresent}
                onChange={(event) => setChainPresent(event.target.checked)}
                className="mt-3 mr-2"
              />
              VITE_CHAIN_ID
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(plan.readiness.categories).map(([category, item]) => (
              <div key={category} className="grid grid-cols-[120px_1fr_56px] items-center gap-3 text-sm">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">{category}</span>
                <div className="h-2 rounded bg-vault-dark">
                  <div className={`h-2 rounded ${barClass(item.score)}`} style={{ width: `${item.score}%` }} />
                </div>
                <span className="text-right text-vault-text">{item.score}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Checks">
          <div className="mt-3 max-h-[560px] overflow-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                <tr>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Gate</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Check</th>
                  <th className="py-2 pr-3">Owner</th>
                </tr>
              </thead>
              <tbody className="text-sm text-vault-text">
                {plan.checks.map((check) => (
                  <tr key={check.id} className="border-t border-vault-border align-top">
                    <td className="py-2 pr-3">
                      <StatusPill status={check.status} />
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-vault-text-dim">{check.gate}</td>
                    <td className="py-2 pr-3">{check.category}</td>
                    <td className="py-2 pr-3">
                      <div>{check.title}</div>
                      <div className="mt-1 text-xs text-vault-text-dim">{check.evidence.slice(0, 2).join(' ')}</div>
                    </td>
                    <td className="py-2 pr-3">{check.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Risks">
          <div className="mt-3 space-y-2">
            {plan.risks.slice(0, 10).map((risk) => (
              <label key={risk.id} className="block rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedRisks.includes(risk.id)}
                    onChange={() => toggleRisk(risk.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-tungsten">{risk.severity} / {risk.category}</span>
                    <span className="block mt-1">{risk.title}</span>
                    <span className="block mt-1 text-xs text-vault-text-dim">{risk.mitigation}</span>
                  </span>
                </div>
              </label>
            ))}
          </div>
          <LaunchButton onClick={() => downloadText('launch-risks.md', exportLaunchRiskRegisterMarkdown(plan), 'text/markdown')}>Export risks</LaunchButton>
        </Panel>

        <Panel title="Decision">
          <div className="mt-3 space-y-3">
            <select
              value={decisionStatus}
              onChange={(event) => setDecisionStatus(event.target.value)}
              className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
            >
              {DECISION_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            <input
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
              placeholder="Operator"
            />
            <textarea
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              className="min-h-[110px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text"
              placeholder="Decision rationale"
            />
            <label className="flex items-center gap-2 text-sm text-vault-text">
              <input type="checkbox" checked={override} onChange={(event) => setOverride(event.target.checked)} />
              Override blockers
            </label>
            {override && (
              <textarea
                value={overrideRationale}
                onChange={(event) => setOverrideRationale(event.target.value)}
                className="min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text"
                placeholder="Override rationale"
              />
            )}
            <LaunchButton onClick={recordDecision}>Record decision</LaunchButton>
          </div>
        </Panel>

        <Panel title="Rollback">
          <div className="mt-3 space-y-3 text-sm text-vault-text">
            <MiniList label="Triggers" items={plan.rollback.triggers} />
            <MiniList label="Steps" items={plan.rollback.steps} />
            <MiniList label="Verification" items={plan.rollback.verification} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Proof">
          <div className="mt-3 space-y-2 text-sm text-vault-text">
            <ProofRow label="Simulator" value={`${plan.proof.simulator.score.toFixed(1)} / ${plan.proof.simulator.games} games`} />
            <ProofRow label="Replay" value={`${plan.proof.replay.score.toFixed(1)} / ${plan.proof.replay.title}`} />
            <ProofRow label="Ghosts" value={`${plan.proof.ghosts.score}/100 / ${plan.proof.ghosts.healthiestArchetype || 'cast'}`} />
            <ProofRow label="Mutation" value={`${plan.proof.mutation.score}/100 / ${plan.proof.mutation.verdict}`} />
            <ProofRow label="Playtest" value={`${plan.proof.playtest.difficulty} / ${plan.proof.playtest.roles.length} roles`} />
            <ProofRow label="Design" value={`${plan.proof.design.health.score}/100 / ${plan.proof.design.topHypothesis || 'hypothesis'}`} />
            <ProofRow label="Oracle" value={`${plan.proof.oracle.health.score}/100 ${plan.proof.oracle.health.status}`} />
            <a className="block text-oxide-green hover:text-vault-text" href={plan.proof.replay.shareUrl}>
              {plan.proof.replay.shareUrl}
            </a>
          </div>
        </Panel>

        <Panel title="Routes">
          <div className="mt-3 space-y-2">
            {PUBLIC_ROUTES.map((route) => {
              const result = routeResults[route];
              return (
                <div key={route} className="flex items-center justify-between gap-3 rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm">
                  <span className="font-mono text-vault-text">{route}</span>
                  <span className={result?.ok ? 'text-oxide-green' : 'text-vault-text-dim'}>
                    {result ? `${result.status} / ${result.ms}ms` : 'unchecked'}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Packets and decisions">
          <div className="mt-3 space-y-2 text-sm text-vault-text">
            {packets.slice(0, 4).map((packet) => (
              <div key={packet.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                {packet.targetGate}: {packet.status} / {packet.score}
              </div>
            ))}
            {decisions.slice(0, 4).map((decision) => (
              <div key={decision.id} className="rounded border border-vault-border bg-vault-dark px-3 py-2">
                {decision.status}: {decision.operator || 'operator pending'}
              </div>
            ))}
          </div>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            className="mt-3 min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text"
            placeholder="Paste launch packet JSON array"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <LaunchButton onClick={() => downloadText('launch-packets.json', exportLaunchPackets(), 'application/json')}>Export</LaunchButton>
            <LaunchButton onClick={importPackets} disabled={!importText.trim()}>Import</LaunchButton>
          </div>
        </Panel>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Packet preview</p>
        <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-vault-border bg-vault-dark p-3 text-xs leading-5 text-vault-text">
          {exportLaunchPacketMarkdown(plan)}
        </pre>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = 'neutral' }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
      <div className="label">{label}</div>
      <div className={`mt-2 truncate font-display text-lg ${tone === 'good' ? 'text-oxide-green' : tone === 'bad' ? 'text-red-300' : 'text-vault-text'}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <p className="label">{title}</p>
      {children}
    </section>
  );
}

function LaunchButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:bg-vault-panel disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${pillClass(status)}`}>
      {status}
    </span>
  );
}

function MiniList({ label, items }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-xs text-vault-text-dim">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProofRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function statusClass(status) {
  if (status === 'ready' || status === 'monitoring') return 'good';
  if (status === 'blocked') return 'bad';
  return 'neutral';
}

function barClass(score) {
  if (score >= 85) return 'bg-oxide-green';
  if (score >= 65) return 'bg-tungsten';
  return 'bg-red-300';
}

function pillClass(status) {
  if (status === 'pass') return 'border-oxide-green/40 bg-oxide-green/10 text-oxide-green';
  if (status === 'warn' || status === 'unknown' || status === 'skipped') return 'border-tungsten/40 bg-tungsten/10 text-tungsten';
  return 'border-red-300/40 bg-red-300/10 text-red-300';
}
