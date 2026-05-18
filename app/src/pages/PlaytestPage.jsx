import { useMemo, useState } from 'react';
import { PageIntro, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import { buildReplayFromSeed } from '../lib/replayDirector';
import { runGhostBatch } from '../lib/playerTelemetryGhosts';
import { generateMutationReport, MUTATION_PRESETS } from '../lib/ruleMutationTimeMachine';
import {
  PLAYTEST_CATEGORIES,
  PLAYTEST_SOURCE_TYPES,
  buildMissionFromGhostReport,
  buildMissionFromMutationReport,
  buildMissionFromReplay,
  buildMissionFromSimulator,
  buildPlaytestMission,
  createSyntheticPlaytestSession,
  exportPlaytestBacklogCsv,
  exportPlaytestMissionJson,
  exportPlaytestMissionMarkdown,
  exportPlaytestMissions,
  exportPlaytestReportMarkdown,
  generatePlaytestBacklog,
  generatePlaytestReport,
  importPlaytestMissions,
  listPinnedPlaytestMissions,
  listPlaytestMissions,
  listPlaytestReports,
  pinPlaytestMission,
  savePlaytestMission,
  savePlaytestReport,
  savePlaytestSession,
  scorePlaytestFeedback,
} from '../lib/playtestCoach';

const SCENARIOS = ['new-player-table', 'comeback-test', 'stall-test', 'all-aggressive', 'all-searchers', 'marketing-snapshot'];
const GHOST_SCENARIOS = ['balanced-cast', 'sabotage-den', 'greedy-table', 'comeback-lab', 'stall-risk-lab', 'high-drama-cast'];

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PlaytestPage() {
  const [sourceType, setSourceType] = useState('manual-design-question');
  const [category, setCategory] = useState('onboarding');
  const [question, setQuestion] = useState('Can a first-time player understand the goal, choose actions, and remember one dramatic moment?');
  const [duration, setDuration] = useState('15-minute playtest');
  const [testers, setTesters] = useState(4);
  const [seed, setSeed] = useState('playtest-dashboard');
  const [scenario, setScenario] = useState('new-player-table');
  const [ghostScenario, setGhostScenario] = useState('balanced-cast');
  const [mutationPreset, setMutationPreset] = useState('faster-games');
  const [feedback, setFeedback] = useState({
    comprehension: 4,
    agency: 4,
    tension: 4,
    fairness: 4,
    frustration: 2,
    replayability: 4,
    setupFriction: 2,
    wouldReplay: true,
    wouldShare: false,
    rememberedMoment: 'A late lock changed who everyone thought would win.',
    confusionMoment: '',
    frustrationMoment: '',
    notes: 'Tester could explain Pick, Search, and Sabotage after two rounds.',
  });
  const [missions, setMissions] = useState(() => listPlaytestMissions());
  const [reports, setReports] = useState(() => listPlaytestReports());
  const [pinned, setPinned] = useState(() => listPinnedPlaytestMissions());
  const [importText, setImportText] = useState('');

  const replayProof = useMemo(() => buildReplayFromSeed({ seed, scenarioId: scenario, maxRounds: 36 }), [seed, scenario]);
  const ghostReport = useMemo(() => runGhostBatch({
    scenario: ghostScenario,
    seed,
    budget: 'smoke',
    games: 3,
    maxRounds: 36,
  }), [seed, ghostScenario]);
  const mutationReport = useMemo(() => generateMutationReport({
    preset: mutationPreset,
    seed,
    scenario,
    ghostScenario,
    budget: 'smoke',
  }), [seed, scenario, ghostScenario, mutationPreset]);

  const mission = useMemo(() => {
    const common = { category, question, duration, testers, seed, scenario, ghostScenario, mutationPreset };
    if (sourceType === 'simulator-smoke') return buildMissionFromSimulator(common);
    if (sourceType === 'replay-proof') return buildMissionFromReplay(replayProof, common);
    if (sourceType === 'ghost-report') return buildMissionFromGhostReport(ghostReport, common);
    if (sourceType === 'mutation-report') return buildMissionFromMutationReport(mutationReport, common);
    return buildPlaytestMission({ sourceType, ...common });
  }, [sourceType, category, question, duration, testers, seed, scenario, ghostScenario, mutationPreset, replayProof, ghostReport, mutationReport]);

  const scoredFeedback = useMemo(() => scorePlaytestFeedback(mission, feedback), [mission, feedback]);
  const session = useMemo(() => createSyntheticPlaytestSession(mission, feedback), [mission, feedback]);
  const report = useMemo(() => generatePlaytestReport(mission, [session]), [mission, session]);
  const backlog = useMemo(() => generatePlaytestBacklog({
    ghostReport,
    mutationReport,
    replayOpportunity: replayProof,
    launchBlockers: report.result === 'fail' ? [{ title: 'Playtest failure remains unresolved', remediation: report.nextHumanTest }] : [],
  }), [ghostReport, mutationReport, replayProof, report]);

  const updateFeedback = (key, value) => {
    setFeedback((current) => ({ ...current, [key]: value }));
  };

  const saveMission = () => {
    setMissions(savePlaytestMission(mission));
  };

  const saveSessionAndReport = () => {
    savePlaytestSession(session);
    setReports(savePlaytestReport(report));
  };

  const pinMission = () => {
    setPinned(pinPlaytestMission(mission));
  };

  const importMissions = () => {
    const next = importPlaytestMissions(importText);
    setMissions(next);
    setImportText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageIntro route="/playtest" />
      <ProductLoopRail activeStep="playtest" compact />
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="label">Self-Teaching Playtest Coach</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">Human validation cockpit</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              {mission.designQuestion}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
            <Metric label="Score" value={`${scoredFeedback.overallScore}/100`} tone={scoredFeedback.outcome === 'pass' ? 'good' : scoredFeedback.outcome === 'fail' ? 'bad' : 'warn'} />
            <Metric label="Outcome" value={scoredFeedback.outcome} />
            <Metric label="Roles" value={mission.roleAssignments.length} />
            <Metric label="Backlog" value={backlog.length} tone={backlog.length > 4 ? 'warn' : 'good'} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <Select value={sourceType} onChange={setSourceType} options={PLAYTEST_SOURCE_TYPES} />
          <Select value={category} onChange={setCategory} options={PLAYTEST_CATEGORIES} />
          <Select value={duration} onChange={setDuration} options={['5-minute check', '15-minute playtest', '30-minute session', 'focused group', 'launch rehearsal']} />
          <input type="number" min="1" max="6" value={testers} onChange={(event) => setTesters(Number(event.target.value))} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_170px_170px_170px]">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
          <input value={seed} onChange={(event) => setSeed(event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
          <Select value={scenario} onChange={setScenario} options={SCENARIOS} />
          <Select value={ghostScenario} onChange={setGhostScenario} options={GHOST_SCENARIOS} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Select value={mutationPreset} onChange={setMutationPreset} options={Object.keys(MUTATION_PRESETS)} compact />
          <CoachButton onClick={saveMission}>Save mission</CoachButton>
          <CoachButton onClick={pinMission}>Pin mission</CoachButton>
          <CoachButton onClick={saveSessionAndReport}>Save session report</CoachButton>
          <CoachButton onClick={() => navigator.clipboard?.writeText(exportPlaytestMissionMarkdown(mission))}>Copy mission</CoachButton>
          <CoachButton onClick={() => downloadText('playtest-mission.md', exportPlaytestMissionMarkdown(mission), 'text/markdown')}>Markdown</CoachButton>
          <CoachButton onClick={() => downloadText('playtest-mission.json', exportPlaytestMissionJson(mission), 'application/json')}>JSON</CoachButton>
          <CoachButton onClick={() => downloadText('playtest-backlog.csv', exportPlaytestBacklogCsv(backlog), 'text/csv')}>Backlog CSV</CoachButton>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Facilitator script">
          <div className="mt-3 space-y-3 text-sm text-vault-text">
            <p className="rounded border border-vault-border bg-vault-panel/55 p-3">{mission.facilitatorScript.introText}</p>
            <MiniList label="Round prompts" items={mission.facilitatorScript.roundPrompts} />
            <MiniList label="Intervention rules" items={mission.facilitatorScript.interventionRules} />
            <MiniList label="Machine runs" items={mission.recommendedMachineRuns} />
          </div>
        </Panel>
        <Panel title="Tester briefs">
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {mission.testerBriefs.map((brief) => (
              <div key={brief.id} className="rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
                <p className="font-display text-lg">{brief.role}</p>
                <p className="mt-1 text-vault-text-dim">{brief.goal}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-tungsten">{brief.behaviorPrompt}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Feedback scorer">
          <div className="mt-3 space-y-3">
            {[
              ['comprehension', 'Comprehension'],
              ['agency', 'Agency'],
              ['tension', 'Tension'],
              ['fairness', 'Fairness'],
              ['frustration', 'Frustration'],
              ['replayability', 'Replayability'],
              ['setupFriction', 'Setup friction'],
            ].map(([key, label]) => (
              <Slider key={key} label={label} value={feedback[key]} onChange={(value) => updateFeedback(key, value)} />
            ))}
            <label className="flex items-center gap-2 text-sm text-vault-text">
              <input type="checkbox" checked={feedback.wouldReplay} onChange={(event) => updateFeedback('wouldReplay', event.target.checked)} />
              Would replay
            </label>
            <label className="flex items-center gap-2 text-sm text-vault-text">
              <input type="checkbox" checked={feedback.wouldShare} onChange={(event) => updateFeedback('wouldShare', event.target.checked)} />
              Would share replay
            </label>
          </div>
        </Panel>
        <Panel title="Observation sheet">
          <div className="mt-3 space-y-2">
            {mission.observationSheet.dimensions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                <span>{item.label}</span>
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">{item.scale}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Session report">
          <div className="mt-3 space-y-3 text-sm text-vault-text">
            <ProofRow label="Result" value={report.result} />
            <ProofRow label="Decision" value={report.decisionRecommendation} />
            <ProofRow label="Next machine" value={report.nextMachineRun} />
            <textarea value={feedback.rememberedMoment} onChange={(event) => updateFeedback('rememberedMoment', event.target.value)} className="min-h-[70px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text" />
            <textarea value={feedback.notes} onChange={(event) => updateFeedback('notes', event.target.value)} className="min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text" />
            <CoachButton onClick={() => downloadText('playtest-report.md', exportPlaytestReportMarkdown(report), 'text/markdown')}>Report Markdown</CoachButton>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Backlog">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                <tr>
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Mission</th>
                  <th className="py-2 pr-3">Score</th>
                </tr>
              </thead>
              <tbody className="text-sm text-vault-text">
                {backlog.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-t border-vault-border">
                    <td className="py-2 pr-3">{item.rank}</td>
                    <td className="py-2 pr-3">{item.category}</td>
                    <td className="py-2 pr-3">{item.title}</td>
                    <td className="py-2 pr-3">{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Library">
          <div className="mt-3 space-y-2 text-sm text-vault-text">
            {[...pinned, ...missions, ...reports].slice(0, 8).map((item) => (
              <div key={item.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                {item.title || item.mission?.title || item.id}: {item.result || item.category || item.status || 'saved'}
              </div>
            ))}
          </div>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-3 min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text" placeholder="Paste exported mission JSON array" />
          <div className="mt-2 flex flex-wrap gap-2">
            <CoachButton onClick={() => downloadText('playtest-missions.json', exportPlaytestMissions(), 'application/json')}>Export missions</CoachButton>
            <CoachButton onClick={importMissions} disabled={!importText.trim()}>Import missions</CoachButton>
          </div>
        </Panel>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Mission preview</p>
        <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-vault-border bg-vault-dark p-3 text-xs leading-5 text-vault-text">
          {exportPlaytestMissionMarkdown(mission)}
        </pre>
      </section>
    </div>
  );
}

function Select({ value, onChange, options, compact = false }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${compact ? 'mt-3' : ''} min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text`}
    >
      {options.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
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

function CoachButton({ children, onClick, disabled }) {
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

function MiniList({ label, items }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item} className="rounded border border-vault-border bg-vault-dark px-3 py-2 text-xs text-vault-text-dim">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full"
      />
    </label>
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
