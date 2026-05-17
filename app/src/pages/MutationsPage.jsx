import { useMemo, useState } from 'react';
import {
  MUTATION_PRESETS,
  applyRulePatch,
  exportMutationMatrixCsv,
  exportMutationReportJson,
  exportMutationReportMarkdown,
  exportMutationReports,
  exportRuleDiffCsv,
  generateMutationMatrix,
  generateMutationReport,
  importMutationReports,
  listMutationReports,
  listPinnedMutationCandidates,
  pinMutationCandidate,
  saveMutationReport,
} from '../lib/ruleMutationTimeMachine';
import { SIM_DEFAULT_RULES } from '../lib/plundrixEngine';

const RULE_FIELDS = [
  ['totalLocks', 'Total locks', 3, 9],
  ['maxTools', 'Max tools', 1, 9],
  ['pickBaseChance', 'Pick base chance', 5, 95],
  ['pickToolBonus', 'Pick tool bonus', 0, 50],
  ['pickChanceCap', 'Pick chance cap', 5, 99],
  ['searchChance', 'Search chance', 5, 95],
  ['stunnedSearchChance', 'Stunned search chance', 0, 95],
];

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MutationsPage() {
  const [preset, setPreset] = useState('faster-games');
  const [seed, setSeed] = useState('mutation-dashboard');
  const [scenario, setScenario] = useState('new-player-table');
  const [ghostScenario, setGhostScenario] = useState('balanced-cast');
  const [baselineRules, setBaselineRules] = useState(SIM_DEFAULT_RULES);
  const [candidateRules, setCandidateRules] = useState(() => applyRulePatch(SIM_DEFAULT_RULES, MUTATION_PRESETS['faster-games'].patch));
  const [reports, setReports] = useState(() => listMutationReports());
  const [pinned, setPinned] = useState(() => listPinnedMutationCandidates());
  const [importText, setImportText] = useState('');

  const report = useMemo(() => generateMutationReport({
    preset,
    seed,
    scenario,
    ghostScenario,
    baselineRules,
    candidateRules,
    budget: 'smoke',
  }), [preset, seed, scenario, ghostScenario, baselineRules, candidateRules]);

  const matrix = useMemo(() => generateMutationMatrix({
    seed,
    scenario,
    ghostScenario,
    baselineRules,
    budget: 'smoke',
  }), [seed, scenario, ghostScenario, baselineRules]);

  const applyPreset = (id) => {
    setPreset(id);
    setCandidateRules(applyRulePatch(baselineRules, MUTATION_PRESETS[id].patch));
  };

  const setRule = (target, key, value) => {
    const setter = target === 'baseline' ? setBaselineRules : setCandidateRules;
    setter((current) => applyRulePatch(current, { [key]: Number(value) }));
  };

  const saveReport = () => {
    setReports(saveMutationReport(report));
  };

  const pinCandidate = () => {
    setPinned(pinMutationCandidate(report));
  };

  const importReports = () => {
    const next = importMutationReports(importText);
    setReports(next);
    setImportText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="label">Rule Mutation Time Machine</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">What changed and why?</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              Compare baseline and candidate rules with the same seed, same strategies, same replay pipeline, and same ghost cast.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
            <Metric label="Score" value={`${report.score.total}/100`} tone={report.score.total >= 70 ? 'good' : 'warn'} />
            <Metric label="Verdict" value={report.verdict} />
            <Metric label="Rounds" value={report.comparison.simulation.roundDelta} />
            <Metric label="Ghosts" value={report.comparison.ghosts.scoreDelta} tone={report.comparison.ghosts.scoreDelta >= 0 ? 'good' : 'bad'} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <select value={preset} onChange={(event) => applyPreset(event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text">
            {Object.values(MUTATION_PRESETS).map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <input value={seed} onChange={(event) => setSeed(event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
          <select value={scenario} onChange={(event) => setScenario(event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text">
            {['new-player-table', 'comeback-test', 'stall-test', 'all-aggressive', 'all-searchers', 'marketing-snapshot'].map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
          <select value={ghostScenario} onChange={(event) => setGhostScenario(event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text">
            {['balanced-cast', 'sabotage-den', 'greedy-table', 'comeback-lab', 'stall-risk-lab', 'high-drama-cast'].map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <MutationButton onClick={saveReport}>Save report</MutationButton>
          <MutationButton onClick={pinCandidate}>Pin candidate</MutationButton>
          <MutationButton onClick={() => navigator.clipboard?.writeText(exportMutationReportMarkdown(report))}>Copy report</MutationButton>
          <MutationButton onClick={() => navigator.clipboard?.writeText(JSON.stringify(report.comparison.rollbackPatch, null, 2))}>Copy rollback patch</MutationButton>
          <MutationButton onClick={() => downloadText('rule-mutation.md', exportMutationReportMarkdown(report), 'text/markdown')}>Markdown</MutationButton>
          <MutationButton onClick={() => downloadText('rule-mutation.json', exportMutationReportJson(report), 'application/json')}>JSON</MutationButton>
          <MutationButton onClick={() => downloadText('rule-diff.csv', exportRuleDiffCsv(report.comparison.ruleDiff), 'text/csv')}>Diff CSV</MutationButton>
          <MutationButton onClick={() => downloadText('mutation-matrix.csv', exportMutationMatrixCsv(matrix), 'text/csv')}>Matrix CSV</MutationButton>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RulesPanel title="Baseline rules" rules={baselineRules} target="baseline" onChange={setRule} />
        <RulesPanel title="Candidate rules" rules={candidateRules} target="candidate" onChange={setRule} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Preset buttons">
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.values(MUTATION_PRESETS).map((item) => (
              <button key={item.id} type="button" onClick={() => applyPreset(item.id)} className="rounded border border-vault-border bg-vault-panel/55 p-3 text-left hover:bg-vault-panel">
                <p className="text-sm text-vault-text">{item.label}</p>
                <p className="mt-1 text-xs text-vault-text-dim">{item.intendedEffect}</p>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Score breakdown">
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(report.score.components).map(([key, value]) => (
              <div key={key} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">{key}</p>
                <p className="mt-1 text-sm text-vault-text">{Number(value).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded border border-vault-border bg-vault-dark p-3 text-sm text-vault-text">
            {report.recommendation.summary}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Rule diff">
          <div className="mt-3 space-y-2">
            {report.comparison.ruleDiff.map((item) => (
              <div key={item.key} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                {item.key}: {item.before} {'->'} {item.after}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Replay comparison">
          <div className="mt-3 space-y-2 text-sm text-vault-text">
            <ProofRow label="Baseline" value={report.comparison.replay.baseline.dramaticScore.toFixed(1)} />
            <ProofRow label="Candidate" value={report.comparison.replay.candidate.dramaticScore.toFixed(1)} />
            <ProofRow label="Drama delta" value={report.comparison.replay.delta.dramaticScore.toFixed(1)} />
            <a className="block text-oxide-green" href={report.comparison.replayLinks.better}>Better replay link</a>
          </div>
        </Panel>
        <Panel title="Contract impact">
          <div className="mt-3 rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
            <p className="font-display text-lg">{report.comparison.contractImpact.level}</p>
            <p className="mt-2 text-vault-text-dim">{report.comparison.contractImpact.summary}</p>
            <pre className="mt-3 overflow-auto rounded bg-vault-dark p-3 text-xs">{JSON.stringify(report.comparison.rollbackPatch, null, 2)}</pre>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Tension chart">
          <div className="mt-3 flex h-44 items-end gap-1 rounded border border-vault-border bg-vault-dark p-3">
            {report.comparison.tension.rounds.slice(0, 30).map((round) => (
              <div key={round.round} className="flex flex-1 flex-col justify-end gap-1">
                <div className="bg-tungsten" style={{ height: `${Math.max(3, round.candidateTension)}%` }} />
                <div className="bg-oxide-green" style={{ height: `${Math.max(3, round.baselineTension)}%` }} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Ghost archetype deltas">
          <div className="mt-3 space-y-2">
            {report.comparison.ghosts.archetypeDeltas.map((item) => (
              <div key={item.archetypeId} className="grid grid-cols-[1fr_70px_70px] gap-3 rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                <span>{item.label}</span>
                <span>Health {Math.round(item.healthDelta)}</span>
                <span>Risk {item.frustrationDelta}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Mutation matrix</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
              <tr>
                <th className="py-2 pr-3">Preset</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Verdict</th>
                <th className="py-2 pr-3">Rounds</th>
                <th className="py-2 pr-3">Drama</th>
                <th className="py-2 pr-3">Ghosts</th>
                <th className="py-2 pr-3">Contract</th>
              </tr>
            </thead>
            <tbody className="text-sm text-vault-text">
              {matrix.rows.map((row) => (
                <tr key={row.preset} className="border-t border-vault-border">
                  <td className="py-2 pr-3">{row.label}</td>
                  <td className="py-2 pr-3">{row.score}</td>
                  <td className="py-2 pr-3">{row.verdict}</td>
                  <td className="py-2 pr-3">{row.roundDelta}</td>
                  <td className="py-2 pr-3">{row.dramaDelta.toFixed(1)}</td>
                  <td className="py-2 pr-3">{row.ghostDelta}</td>
                  <td className="py-2 pr-3">{row.contractImpact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Pinned candidates">
          <div className="mt-3 space-y-2">
            {pinned.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                {item.scenario.preset.label}: {item.score.total}/100
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Saved reports">
          <div className="mt-3 space-y-2">
            {reports.slice(0, 5).map((item) => (
              <button key={item.id} type="button" onClick={() => setCandidateRules(item.scenario.candidateRules)} className="block w-full rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-left text-sm text-vault-text">
                {item.scenario.preset.label}: {item.score.total}/100
              </button>
            ))}
          </div>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-3 min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text" placeholder="Paste mutation reports JSON" />
          <div className="mt-2 flex flex-wrap gap-2">
            <MutationButton onClick={() => downloadText('mutation-reports.json', exportMutationReports(), 'application/json')}>Export reports</MutationButton>
            <MutationButton onClick={importReports}>Import reports</MutationButton>
          </div>
        </Panel>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Report preview</p>
        <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-vault-border bg-vault-dark p-3 text-xs leading-5 text-vault-text">
          {exportMutationReportMarkdown(report)}
        </pre>
      </section>
    </div>
  );
}

function RulesPanel({ title, rules, target, onChange }) {
  return (
    <Panel title={title}>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {RULE_FIELDS.map(([key, label, min, max]) => (
          <label key={key} className="grid gap-2 rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
            <span className="flex justify-between gap-3">
              <span>{label}</span>
              <span className="font-mono text-xs text-vault-text-dim">{rules[key]}</span>
            </span>
            <input type="range" min={min} max={max} value={rules[key]} onChange={(event) => onChange(target, key, event.target.value)} />
          </label>
        ))}
      </div>
    </Panel>
  );
}

function Metric({ label, value, tone = 'neutral' }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
      <div className="label">{label}</div>
      <div className={`mt-2 truncate font-display text-lg ${tone === 'good' ? 'text-oxide-green' : tone === 'bad' ? 'text-red-300' : tone === 'warn' ? 'text-tungsten' : 'text-vault-text'}`}>
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

function MutationButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:bg-vault-panel">
      {children}
    </button>
  );
}

function ProofRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">{label}</span>
      <span>{value}</span>
    </div>
  );
}
