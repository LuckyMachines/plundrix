import { useMemo, useState } from 'react';
import { PageIntro, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import {
  GHOST_ARCHETYPE_IDS,
  GHOST_ARCHETYPES,
  GHOST_SCENARIOS,
  buildGhostProfile,
  exportGhostReportCsv,
  exportGhostReportJson,
  exportGhostReportMarkdown,
  exportGhostRosterJson,
  generateGhostRoster,
  listGhostReports,
  listGhostRosters,
  listPinnedGhosts,
  pinGhost,
  runGhostBatch,
  saveGhostReport,
  saveGhostRoster,
} from '../lib/playerTelemetryGhosts';

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GhostsPage() {
  const [scenario, setScenario] = useState('balanced-cast');
  const [seed, setSeed] = useState('ghost-dashboard');
  const [games, setGames] = useState(4);
  const [roster, setRoster] = useState(() => generateGhostRoster('ghost-dashboard', 4, { scenario: 'balanced-cast' }));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reports, setReports] = useState(() => listGhostReports());
  const [rosters, setRosters] = useState(() => listGhostRosters());
  const [pinned, setPinned] = useState(() => listPinnedGhosts());

  const report = useMemo(() => runGhostBatch({
    scenario,
    seed,
    budget: 'smoke',
    games,
    roster,
    maxRounds: 36,
  }), [scenario, seed, games, roster]);

  const selectedGhost = roster[selectedIndex] || roster[0];

  const regenerate = () => {
    setRoster(generateGhostRoster(`${seed}-${Date.now()}`, 4, { scenario }));
  };

  const updateGhost = (patch) => {
    setRoster((current) => current.map((ghost, index) => (
      index === selectedIndex
        ? buildGhostProfile(patch.archetypeId || ghost.archetypeId, { ...ghost, ...patch, id: ghost.id, name: patch.name ?? ghost.name })
        : ghost
    )));
  };

  const saveCurrentReport = () => {
    setReports(saveGhostReport(report));
  };

  const saveCurrentRoster = () => {
    setRosters(saveGhostRoster(roster));
  };

  const pinCurrentGhost = () => {
    setPinned(pinGhost(selectedGhost));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageIntro route="/ghosts" />
      <ProductLoopRail activeStep="ghosts" compact />
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="label">Player Telemetry Ghosts</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">Living test cast</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              Named archetypes run through the same simulator engine and turn outcomes into player-style health, replay proof, and tuning signals.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
            <Metric label="Score" value={`${report.score.score}/100`} tone={report.score.score >= 70 ? 'good' : 'warn'} />
            <Metric label="Grade" value={report.score.grade} />
            <Metric label="Fun" value={report.score.funContribution} />
            <Metric label="Risk" value={report.score.frustrationRisk} tone={report.score.frustrationRisk > 55 ? 'bad' : 'good'} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_140px]">
          <select
            value={scenario}
            onChange={(event) => {
              setScenario(event.target.value);
              setRoster(generateGhostRoster(seed, 4, { scenario: event.target.value }));
            }}
            className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
          >
            {Object.values(GHOST_SCENARIOS).map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <input
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
            placeholder="Seed"
          />
          <input
            type="number"
            min="2"
            max="12"
            value={games}
            onChange={(event) => setGames(Number(event.target.value))}
            className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <GhostButton onClick={regenerate}>Generate cast</GhostButton>
          <GhostButton onClick={saveCurrentRoster}>Save roster</GhostButton>
          <GhostButton onClick={saveCurrentReport}>Save report</GhostButton>
          <GhostButton onClick={() => navigator.clipboard?.writeText(exportGhostReportMarkdown(report))}>Copy report</GhostButton>
          <GhostButton onClick={() => downloadText('player-telemetry-ghosts.md', exportGhostReportMarkdown(report), 'text/markdown')}>Markdown</GhostButton>
          <GhostButton onClick={() => downloadText('player-telemetry-ghosts.json', exportGhostReportJson(report), 'application/json')}>JSON</GhostButton>
          <GhostButton onClick={() => downloadText('player-telemetry-ghosts.csv', exportGhostReportCsv(report), 'text/csv')}>CSV</GhostButton>
          <GhostButton onClick={() => downloadText('ghost-roster.json', exportGhostRosterJson(roster), 'application/json')}>Roster</GhostButton>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Roster editor">
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {roster.map((ghost, index) => (
              <button
                key={ghost.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`rounded border p-3 text-left ${index === selectedIndex ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-panel/55'}`}
              >
                <p className="font-display text-lg text-vault-text">{ghost.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-vault-text-dim">{ghost.archetypeLabel}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-vault-text-dim">
                  <span>Agg {ghost.aggression}</span>
                  <span>Greed {ghost.greed}</span>
                  <span>Sab {ghost.sabotageTendency}</span>
                  <span>Clutch {ghost.clutchBehavior}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedGhost && (
            <div className="mt-4 grid gap-3">
              <input
                value={selectedGhost.name}
                onChange={(event) => updateGhost({ name: event.target.value })}
                className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
              />
              <select
                value={selectedGhost.archetypeId}
                onChange={(event) => updateGhost({ archetypeId: event.target.value })}
                className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
              >
                {GHOST_ARCHETYPE_IDS.map((id) => (
                  <option key={id} value={id}>{GHOST_ARCHETYPES[id].label}</option>
                ))}
              </select>
              <Slider label="Aggression" value={selectedGhost.aggression} onChange={(value) => updateGhost({ aggression: value })} />
              <Slider label="Greed" value={selectedGhost.greed} onChange={(value) => updateGhost({ greed: value })} />
              <Slider label="Sabotage" value={selectedGhost.sabotageTendency} onChange={(value) => updateGhost({ sabotageTendency: value })} />
              <Slider label="Risk" value={selectedGhost.riskTolerance} onChange={(value) => updateGhost({ riskTolerance: value })} />
              <Slider label="Clutch" value={selectedGhost.clutchBehavior} onChange={(value) => updateGhost({ clutchBehavior: value })} />
              <GhostButton onClick={pinCurrentGhost}>Pin ghost</GhostButton>
            </div>
          )}
        </Panel>

        <Panel title="Archetype health">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                <tr>
                  <th className="py-2 pr-3">Archetype</th>
                  <th className="py-2 pr-3">Health</th>
                  <th className="py-2 pr-3">Win</th>
                  <th className="py-2 pr-3">Fun</th>
                  <th className="py-2 pr-3">Frustration</th>
                  <th className="py-2 pr-3">Character</th>
                </tr>
              </thead>
              <tbody className="text-sm text-vault-text">
                {report.archetypes.map((item) => (
                  <tr key={item.archetypeId} className="border-t border-vault-border">
                    <td className="py-2 pr-3">{item.label}</td>
                    <td className="py-2 pr-3">{item.healthScore}</td>
                    <td className="py-2 pr-3">{(item.winRate * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-3">{item.funContribution}</td>
                    <td className="py-2 pr-3">{item.frustrationRisk}</td>
                    <td className="py-2 pr-3">{item.stayedInCharacter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Best story">
          <div className="mt-3 rounded border border-vault-border bg-vault-panel/55 p-3 text-sm text-vault-text">
            <p>{report.bestStory?.headline || 'No story selected.'}</p>
            <p className="mt-2 font-mono text-xs text-vault-text-dim">{report.bestStory?.seed}</p>
            <div className="mt-3 space-y-2">
              {(report.bestStory?.proof || []).map((item) => (
                <div key={item} className="rounded border border-vault-border bg-vault-dark px-3 py-2 text-xs text-vault-text-dim">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="Matchup matrix">
          <div className="mt-3 space-y-2">
            {report.matchups.slice(0, 6).map((item) => (
              <div key={item.matchId} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                <div className="truncate">{item.signature}</div>
                <div className="mt-1 text-xs text-vault-text-dim">Drama {item.dramaScore} / Risk {item.frustrationRisk} / Rounds {item.rounds}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recommendations">
          <div className="mt-3 space-y-2">
            {report.recommendations.map((item) => (
              <div key={item.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                <p className="text-sm text-vault-text">{item.title}</p>
                <p className="mt-1 text-xs text-vault-text-dim">{item.rationale}</p>
                <button type="button" onClick={() => navigator.clipboard?.writeText(item.command)} className="mt-2 font-mono text-xs text-oxide-green">
                  {item.command}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Saved reports">
          <div className="mt-3 space-y-2">
            {reports.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text">
                {item.scenario}: {item.score.score}/100
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Saved rosters and pinned ghosts">
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {rosters.slice(0, 3).map((item) => (
              <button key={item.id} type="button" onClick={() => setRoster(item.roster)} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-left text-sm text-vault-text">
                {item.roster.map((ghost) => ghost.name).join(', ')}
              </button>
            ))}
            {pinned.slice(0, 4).map((ghost) => (
              <div key={ghost.id} className="rounded border border-vault-border bg-vault-dark px-3 py-2 text-sm text-vault-text">
                {ghost.name} / {ghost.archetypeLabel}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Report preview</p>
        <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-vault-border bg-vault-dark p-3 text-xs leading-5 text-vault-text">
          {exportGhostReportMarkdown(report)}
        </pre>
      </section>
    </div>
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

function GhostButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:bg-vault-panel"
    >
      {children}
    </button>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <label className="grid gap-2 rounded border border-vault-border bg-vault-panel/55 p-3">
      <span className="flex items-center justify-between gap-3 text-sm text-vault-text">
        <span>{label}</span>
        <span className="font-mono text-xs text-vault-text-dim">{value}</span>
      </span>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
