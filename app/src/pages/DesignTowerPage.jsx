import { useMemo, useState } from 'react';
import { PageIntro, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import LatestEvidence from '../components/cohesion/LatestEvidence';
import {
  DESIGN_CHANGE_CATEGORIES,
  DESIGN_DECISION_STATUSES,
  DESIGN_EVIDENCE_SOURCES,
  DESIGN_HYPOTHESIS_STATES,
  attachEvidence,
  canTransitionHypothesis,
  createDesignDecision,
  createDesignHypothesis,
  exportDesignBacklogCsv,
  exportDesignHypotheses,
  exportDesignPacketJson,
  exportDesignPacketMarkdown,
  generateDecisionMemo,
  generateDesignBacklog,
  generateDesignTowerSnapshot,
  importDesignHypotheses,
  listDesignDecisions,
  listDesignHypotheses,
  listDesignPackets,
  rankDesignHypotheses,
  recommendNextDesignAction,
  saveDesignDecision,
  saveDesignHypothesis,
  saveDesignPacket,
  summarizeEvidenceStack,
  transitionHypothesis,
} from '../lib/designControlTower';

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DesignTowerPage() {
  const [seed, setSeed] = useState('design-dashboard');
  const [hypotheses, setHypotheses] = useState(() => listDesignHypotheses());
  const [decisions, setDecisions] = useState(() => listDesignDecisions());
  const [packets, setPackets] = useState(() => listDesignPackets());
  const [selectedId, setSelectedId] = useState('');
  const [creator, setCreator] = useState({
    title: 'Improve first match agency',
    category: 'onboarding',
    claim: 'A new player can understand the goal, choose actions, and remember one dramatic moment.',
    desiredOutcome: 'Comprehension and agency reach 4 or higher in playtest.',
    risk: 'Machine proof may overstate human clarity.',
    owner: 'design',
    tags: 'onboarding,agency',
  });
  const [evidence, setEvidence] = useState({
    sourceType: 'manual-note',
    summary: 'Design review found the hypothesis worth testing.',
    confidence: 60,
    score: 60,
    artifactId: 'manual-design-note',
    command: 'npm run design:tower -- --snapshot --markdown',
    path: '',
  });
  const [decisionInput, setDecisionInput] = useState({
    status: 'needs-more-data',
    operator: '',
    rationale: '',
    acceptedRisks: 'Evidence needs another human session.',
  });
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  const snapshot = useMemo(() => generateDesignTowerSnapshot({ seed }), [seed]);
  const backlog = useMemo(() => generateDesignBacklog({
    hypotheses: hypotheses.length ? hypotheses : snapshot.topHypotheses,
  }), [hypotheses, snapshot]);
  const ranked = useMemo(() => rankDesignHypotheses(backlog), [backlog]);
  const selected = ranked.find((item) => item.id === selectedId) || ranked[0] || snapshot.topHypotheses[0];
  const memo = useMemo(() => generateDecisionMemo(selected), [selected]);
  const evidenceStack = useMemo(() => summarizeEvidenceStack(selected), [selected]);
  const nextAction = useMemo(() => recommendNextDesignAction(selected), [selected]);
  const metrics = useMemo(() => {
    const accepted = ranked.filter((item) => item.state === 'accepted').length;
    const rejected = ranked.filter((item) => item.state === 'rejected').length;
    const humanValidation = ranked.filter((item) => item.evidenceGaps?.some((gap) => gap.sourceType === 'playtest-coach')).length;
    const launchBlockers = ranked.filter((item) => item.evidenceGaps?.some((gap) => gap.sourceType === 'launch-copilot')).length;
    const averageConfidence = Math.round(ranked.reduce((sum, item) => sum + (item.score?.confidence || 0), 0) / Math.max(1, ranked.length));
    return { accepted, rejected, humanValidation, launchBlockers, averageConfidence };
  }, [ranked]);

  const createHypothesis = () => {
    const next = createDesignHypothesis(creator);
    const saved = saveDesignHypothesis(next);
    setHypotheses(saved);
    setSelectedId(next.id);
    setMessage('Hypothesis saved.');
  };

  const attachCurrentEvidence = () => {
    const next = attachEvidence(selected, evidence);
    const saved = saveDesignHypothesis(next);
    setHypotheses(saved);
    setSelectedId(next.id);
    setMessage('Evidence attached.');
  };

  const savePacket = () => {
    setPackets(saveDesignPacket(snapshot.packet));
    setMessage('Design packet saved.');
  };

  const transitionCurrent = (nextState) => {
    try {
      const next = transitionHypothesis(selected, nextState, { operator: decisionInput.operator, rationale: decisionInput.rationale });
      const saved = saveDesignHypothesis(next);
      setHypotheses(saved);
      setSelectedId(next.id);
      setMessage(`Moved to ${nextState}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const recordDecision = () => {
    try {
      const decision = createDesignDecision(selected, {
        ...decisionInput,
        acceptedRisks: decisionInput.acceptedRisks.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
      });
      setDecisions(saveDesignDecision(decision));
      setMessage('Decision recorded.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const importHypotheses = () => {
    const next = importDesignHypotheses(importText);
    setHypotheses(next);
    setImportText('');
    setMessage('Hypotheses imported.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageIntro route="/design" />
      <ProductLoopRail activeStep="decide" compact />
      <LatestEvidence compact />
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="label">Design Control Tower</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">Hypotheses, evidence, decisions</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              {selected.claim}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:min-w-[680px]">
            <Metric label="Health" value={`${snapshot.health.score}/100`} tone={snapshot.health.status === 'green' ? 'good' : 'warn'} />
            <Metric label="Hypotheses" value={ranked.length} />
            <Metric label="Human gaps" value={metrics.humanValidation} tone={metrics.humanValidation ? 'warn' : 'good'} />
            <Metric label="Launch gaps" value={metrics.launchBlockers} tone={metrics.launchBlockers ? 'warn' : 'good'} />
            <Metric label="Confidence" value={`${metrics.averageConfidence}/100`} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text"
          />
          <div className="flex flex-wrap gap-2">
            <TowerButton onClick={savePacket}>Save packet</TowerButton>
            <TowerButton onClick={() => navigator.clipboard?.writeText(exportDesignPacketMarkdown(snapshot))}>Copy packet</TowerButton>
            <TowerButton onClick={() => downloadText('design-control-tower.md', exportDesignPacketMarkdown(snapshot), 'text/markdown')}>Markdown</TowerButton>
            <TowerButton onClick={() => downloadText('design-control-tower.json', exportDesignPacketJson(snapshot), 'application/json')}>JSON</TowerButton>
            <TowerButton onClick={() => downloadText('design-backlog.csv', exportDesignBacklogCsv(ranked), 'text/csv')}>CSV</TowerButton>
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-tungsten">{message}</p>}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Hypothesis creator">
          <div className="mt-3 grid gap-3">
            <input value={creator.title} onChange={(event) => setCreator({ ...creator, title: event.target.value })} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
            <select value={creator.category} onChange={(event) => setCreator({ ...creator, category: event.target.value })} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text">
              {DESIGN_CHANGE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea value={creator.claim} onChange={(event) => setCreator({ ...creator, claim: event.target.value })} className="min-h-[80px] rounded border border-vault-border bg-vault-dark p-3 text-vault-text" />
            <textarea value={creator.desiredOutcome} onChange={(event) => setCreator({ ...creator, desiredOutcome: event.target.value })} className="min-h-[70px] rounded border border-vault-border bg-vault-dark p-3 text-vault-text" />
            <textarea value={creator.risk} onChange={(event) => setCreator({ ...creator, risk: event.target.value })} className="min-h-[70px] rounded border border-vault-border bg-vault-dark p-3 text-vault-text" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={creator.owner} onChange={(event) => setCreator({ ...creator, owner: event.target.value })} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
              <input value={creator.tags} onChange={(event) => setCreator({ ...creator, tags: event.target.value })} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
            </div>
            <TowerButton onClick={createHypothesis}>Save hypothesis</TowerButton>
          </div>
        </Panel>

        <Panel title="Ranked backlog">
          <div className="mt-3 max-h-[560px] overflow-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                <tr>
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Hypothesis</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Next action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-vault-text">
                {ranked.map((item) => (
                  <tr key={item.id} className="border-t border-vault-border align-top">
                    <td className="py-2 pr-3">{item.rank}</td>
                    <td className="py-2 pr-3">{item.state}</td>
                    <td className="py-2 pr-3">{item.category}</td>
                    <td className="py-2 pr-3">
                      <button type="button" onClick={() => setSelectedId(item.id)} className="text-left hover:text-tungsten">
                        {item.title}
                      </button>
                      <div className="mt-1 text-xs text-vault-text-dim">{summarizeEvidenceStack(item).sources.join(', ') || 'no evidence'}</div>
                    </td>
                    <td className="py-2 pr-3">{item.score.total}</td>
                    <td className="py-2 pr-3">{item.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Selected hypothesis">
          <div className="mt-3 space-y-3 text-sm text-vault-text">
            <ProofRow label="Title" value={selected.title} />
            <ProofRow label="State" value={selected.state} />
            <ProofRow label="Score" value={`${selected.score.total}/100`} />
            <ProofRow label="Next" value={nextAction.label} />
            <MiniList label="Evidence gaps" items={(selected.evidenceGaps || []).map((gap) => gap.label)} />
            <MiniList label="History" items={(selected.history || []).slice(0, 4).map((item) => item.summary)} />
          </div>
        </Panel>

        <Panel title="Evidence intake">
          <div className="mt-3 space-y-3">
            <select value={evidence.sourceType} onChange={(event) => setEvidence({ ...evidence, sourceType: event.target.value })} className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text">
              {DESIGN_EVIDENCE_SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea value={evidence.summary} onChange={(event) => setEvidence({ ...evidence, summary: event.target.value })} className="min-h-[80px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text" />
            <Slider label="Confidence" value={evidence.confidence} onChange={(value) => setEvidence({ ...evidence, confidence: value })} />
            <Slider label="Score" value={evidence.score} onChange={(value) => setEvidence({ ...evidence, score: value })} />
            <input value={evidence.artifactId} onChange={(event) => setEvidence({ ...evidence, artifactId: event.target.value })} className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
            <input value={evidence.command} onChange={(event) => setEvidence({ ...evidence, command: event.target.value })} className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text" />
            <TowerButton onClick={attachCurrentEvidence}>Attach evidence</TowerButton>
          </div>
        </Panel>

        <Panel title="Lifecycle and decision">
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {DESIGN_HYPOTHESIS_STATES.filter((state) => canTransitionHypothesis(selected, state)).map((state) => (
                <TowerButton key={state} onClick={() => transitionCurrent(state)}>{state}</TowerButton>
              ))}
            </div>
            <select value={decisionInput.status} onChange={(event) => setDecisionInput({ ...decisionInput, status: event.target.value })} className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text">
              {DESIGN_DECISION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={decisionInput.operator} onChange={(event) => setDecisionInput({ ...decisionInput, operator: event.target.value })} className="min-h-[44px] w-full rounded border border-vault-border bg-vault-dark px-3 text-vault-text" placeholder="Operator" />
            <textarea value={decisionInput.rationale} onChange={(event) => setDecisionInput({ ...decisionInput, rationale: event.target.value })} className="min-h-[80px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text" placeholder="Rationale" />
            <textarea value={decisionInput.acceptedRisks} onChange={(event) => setDecisionInput({ ...decisionInput, acceptedRisks: event.target.value })} className="min-h-[70px] w-full rounded border border-vault-border bg-vault-dark p-3 text-vault-text" placeholder="Accepted risks" />
            <TowerButton onClick={recordDecision}>Record decision</TowerButton>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Decision memo">
          <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-vault-border bg-vault-dark p-3 text-xs leading-5 text-vault-text">
            {JSON.stringify(memo, null, 2)}
          </pre>
        </Panel>
        <Panel title="Library">
          <div className="mt-3 space-y-2 text-sm text-vault-text">
            <ProofRow label="Accepted" value={metrics.accepted} />
            <ProofRow label="Rejected" value={metrics.rejected} />
            <ProofRow label="Saved hypotheses" value={hypotheses.length} />
            <ProofRow label="Decisions" value={decisions.length} />
            <ProofRow label="Packets" value={packets.length} />
            {[...decisions, ...packets].slice(0, 5).map((item) => (
              <div key={item.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
                {item.status || item.health?.status || 'packet'}: {item.title || item.id}
              </div>
            ))}
          </div>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-3 min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text" placeholder="Paste exported hypothesis JSON array" />
          <div className="mt-2 flex flex-wrap gap-2">
            <TowerButton onClick={() => downloadText('design-hypotheses.json', exportDesignHypotheses(), 'application/json')}>Export hypotheses</TowerButton>
            <TowerButton onClick={importHypotheses} disabled={!importText.trim()}>Import hypotheses</TowerButton>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = 'neutral' }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
      <div className="label">{label}</div>
      <div className={`mt-2 truncate font-display text-lg ${tone === 'good' ? 'text-oxide-green' : tone === 'warn' ? 'text-tungsten' : 'text-vault-text'}`}>
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

function TowerButton({ children, onClick, disabled }) {
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

function ProofRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function MiniList({ label, items }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-2 space-y-1">
        {(items.length ? items : ['None']).map((item) => (
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
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full"
      />
    </label>
  );
}
