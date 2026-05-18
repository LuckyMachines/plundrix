import { useMemo, useState } from 'react';
import {
  addOracleDecision,
  exportOracleJson,
  exportOracleMarkdown,
  exportOracleSnapshots,
  exportRecommendationsCsv,
  generateOracleReport,
  getOracleTrend,
  importOracleSnapshots,
  listOracleDecisions,
  listOracleSnapshots,
  saveOracleSnapshot,
} from '../lib/liveOpsOracle';

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OpsPage() {
  const [operatorNotes, setOperatorNotes] = useState('');
  const [manualFiles, setManualFiles] = useState({});
  const [report, setReport] = useState(() => generateOracleReport({
    seed: 'ops-page',
    files: {},
    packageJson: { scripts: {} },
  }));
  const [snapshots, setSnapshots] = useState(() => listOracleSnapshots());
  const [decisions, setDecisions] = useState(() => listOracleDecisions());
  const [importText, setImportText] = useState('');
  const trend = useMemo(() => getOracleTrend(snapshots), [snapshots]);
  const nextCommand = report.recommendations.find((item) => item.commands.length)?.commands[0] || 'npm run ops:oracle';

  const refresh = () => {
    setReport(generateOracleReport({
      seed: `ops-page-${Date.now()}`,
      files: manualFiles,
      packageJson: { scripts: {} },
      manualOperatorNotes: operatorNotes,
    }));
  };

  const saveSnapshot = () => {
    const next = saveOracleSnapshot(report);
    setSnapshots(next);
  };

  const recordDecision = (recommendation, status) => {
    const next = addOracleDecision({
      recommendationId: recommendation.id,
      title: recommendation.title,
      status,
      notes: operatorNotes,
    });
    setDecisions(next);
  };

  const importSnapshots = () => {
    const next = importOracleSnapshots(importText);
    setSnapshots(next);
    setImportText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="label">Live Ops Oracle</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">What should we do next?</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              Lightweight daily command center for balance, replay proof, release readiness, docs, operations, and future live data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            <Metric label="Health" value={`${report.health.score}/100`} />
            <Metric label="Status" value={report.health.status} />
            <Metric label="Gate" value={report.releaseReadiness.nextGate} />
            <Metric label="Trend" value={trend.available ? `${trend.delta >= 0 ? '+' : ''}${trend.delta}` : 'new'} />
          </div>
        </div>
        <p className="mt-4 rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
          {report.health.explanation}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <OpsButton onClick={refresh}>Refresh light</OpsButton>
          <OpsButton onClick={saveSnapshot}>Save snapshot</OpsButton>
          <OpsButton onClick={() => navigator.clipboard?.writeText(nextCommand)}>Copy next command</OpsButton>
          <OpsButton onClick={() => navigator.clipboard?.writeText(exportOracleMarkdown(report))}>Copy daily brief</OpsButton>
          <OpsButton onClick={() => navigator.clipboard?.writeText(report.releaseNotes)}>Copy release notes</OpsButton>
          <OpsButton onClick={() => navigator.clipboard?.writeText(JSON.stringify(report.marketingBundle, null, 2))}>Copy marketing bundle</OpsButton>
          <OpsButton onClick={() => downloadText('live-ops-oracle.md', exportOracleMarkdown(report), 'text/markdown')}>Markdown</OpsButton>
          <OpsButton onClick={() => downloadText('live-ops-oracle.json', exportOracleJson(report), 'application/json')}>JSON</OpsButton>
          <OpsButton onClick={() => downloadText('live-ops-recommendations.csv', exportRecommendationsCsv(report), 'text/csv')}>CSV</OpsButton>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(report.health.categories).map(([category, status]) => (
          <article key={category} className="rounded border border-vault-border bg-vault-surface/75 p-4">
            <p className="label">{category}</p>
            <h2 className="mt-2 font-display text-xl text-vault-text">{status}</h2>
          </article>
        ))}
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="label">Live telemetry</p>
            <h2 className="mt-2 font-display text-2xl text-vault-text">{report.liveDataStatus.connected ? 'Local signal connected' : 'Awaiting live feed'}</h2>
            <p className="mt-2 text-sm text-vault-text-dim">{report.liveDataStatus.statusText}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:min-w-[520px]">
            <Metric label="Events" value={report.liveDataStatus.summary?.eventCount ?? 0} />
            <Metric label="Sessions" value={report.liveDataStatus.summary?.sessionsObserved ?? 0} />
            <Metric label="Completion" value={`${Math.round((report.liveDataStatus.summary?.completionRate || 0) * 100)}%`} />
            <Metric label="Replays" value={report.liveDataStatus.summary?.replayGenerated ?? 0} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Recommendations</p>
            <span className="font-mono text-xs text-vault-text-dim">{report.recommendations.length}</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                <tr>
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Impact</th>
                  <th className="py-2 pr-3">Effort</th>
                  <th className="py-2 pr-3">Command</th>
                  <th className="py-2 pr-3">Decision</th>
                </tr>
              </thead>
              <tbody className="text-sm text-vault-text">
                {report.recommendations.map((item) => (
                  <tr key={item.id} className="border-t border-vault-border">
                    <td className="py-2 pr-3">{item.rank}</td>
                    <td className="py-2 pr-3">{item.category}</td>
                    <td className="py-2 pr-3">
                      <div>{item.title}</div>
                      <div className="text-xs text-vault-text-dim">{item.rationale}</div>
                    </td>
                    <td className="py-2 pr-3">{item.impact}</td>
                    <td className="py-2 pr-3">{item.effort}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-oxide-green">
                      {item.commands[0] ? (
                        <button type="button" onClick={() => navigator.clipboard?.writeText(item.commands[0])}>
                          {item.commands[0]}
                        </button>
                      ) : 'manual'}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        {['accepted', 'rejected', 'deferred', 'shipped'].map((status) => (
                          <button key={status} type="button" onClick={() => recordDecision(item, status)} className="text-xs text-vault-text-dim hover:text-vault-text">
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Action plan">
            {['now', 'next', 'later'].map((lane) => (
              <div key={lane} className="mt-3">
                <p className="label">{lane}</p>
                <div className="mt-2 space-y-2">
                  {report.actionPlan[lane].map((item) => (
                    <div key={item.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Operator notes">
            <textarea
              value={operatorNotes}
              onChange={(event) => setOperatorNotes(event.target.value)}
              className="mt-3 min-h-[130px] w-full rounded border border-vault-border bg-vault-dark p-3 text-sm text-vault-text"
              placeholder="Add notes for decisions or daily brief context"
            />
          </Panel>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Risks">
          <div className="mt-3 space-y-2">
            {report.risks.map((risk) => (
              <div key={risk.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-tungsten">{risk.severity} / {risk.category}</div>
                <p className="mt-1 text-sm text-vault-text">{risk.title}</p>
                <p className="mt-1 text-xs text-vault-text-dim">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Opportunities">
          <div className="mt-3 space-y-2">
            {report.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide-green">{opportunity.category}</div>
                <p className="mt-1 text-sm text-vault-text">{opportunity.title}</p>
                <p className="mt-1 text-xs text-vault-text-dim">{opportunity.action}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Replay proof">
          <div className="mt-3 space-y-2">
            {report.marketingProof.strongestReplays.map((replay) => (
              <a key={replay.id} href={replay.shareUrl} className="block rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text hover:bg-vault-panel">
                {replay.title}
              </a>
            ))}
          </div>
        </Panel>
        <Panel title="Balance candidates">
          <div className="mt-3 space-y-2">
            {report.experimentStatus.slice(0, 4).map((candidate) => (
              <div key={candidate.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                {candidate.id}: {candidate.lifecycle}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Snapshots">
          <div className="mt-3 space-y-2">
            {snapshots.slice(0, 5).map((snapshot) => (
              <div key={snapshot.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                {snapshot.generatedAt}: {snapshot.health.score}
              </div>
            ))}
          </div>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            className="mt-3 min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text"
            placeholder="Paste Oracle snapshot JSON"
          />
          <div className="mt-2 flex gap-2">
            <OpsButton onClick={() => downloadText('oracle-snapshots.json', exportOracleSnapshots(), 'application/json')}>Export</OpsButton>
            <OpsButton onClick={importSnapshots} disabled={!importText.trim()}>Import</OpsButton>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Decision log">
          <div className="mt-3 space-y-2">
            {decisions.slice(0, 8).map((decision) => (
              <div key={decision.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                {decision.status}: {decision.title}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Release and marketing exports">
          <pre className="mt-3 max-h-[360px] overflow-auto rounded border border-vault-border bg-vault-dark p-3 text-xs text-vault-text">
            {report.releaseNotes}
          </pre>
        </Panel>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
      <div className="label">{label}</div>
      <div className="mt-2 truncate font-display text-lg text-vault-text">{value}</div>
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

function OpsButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:bg-vault-panel disabled:opacity-40"
    >
      {children}
    </button>
  );
}
