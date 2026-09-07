import { useMemo, useState } from 'react';
import { DELIGHT_MOMENTS, readObservations, saveObservation, summarizeObservations } from '../../lib/observationStore';
import { readBalanceTelemetry } from '../../lib/gadgetTelemetry';

const INITIAL = { participantCode: 'P-01', completedFirstAction: false, understoodGoal: false, noticedGadget: false, wantedReplay: false, delightMoment: 'none-yet', friction: 'none', secondsToFirstAction: 0 };

function downloadEvidence(records) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), anonymous: true, records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plundrix-first-run-observations.json';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ObservationRecorder() {
  const [form, setForm] = useState(INITIAL);
  const [records, setRecords] = useState(readObservations);
  const summary = useMemo(() => summarizeObservations(records), [records]);
  const telemetry = readBalanceTelemetry();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    const next = saveObservation(form);
    setRecords(next);
    setForm((current) => ({ ...INITIAL, participantCode: `P-${String(next.length + 1).padStart(2, '0')}` }));
  };

  return (
    <section className="rounded border border-oxide-green/35 bg-oxide-green/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="label text-oxide-green">Real-player evidence</p><h2 className="mt-2 font-display text-3xl text-vault-text">First-run observation recorder</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-vault-text-dim">Record behavior, not identity. Entries remain on this device until explicitly exported.</p></div><button type="button" onClick={() => downloadEvidence(records)} disabled={!records.length} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase text-vault-text disabled:opacity-40">Export anonymous JSON</button></div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-xs text-vault-text-dim">Participant code<input value={form.participantCode} onChange={(event) => update('participantCode', event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" /></label><label className="grid gap-1 text-xs text-vault-text-dim">Seconds to first action<input type="number" min="0" max="900" value={form.secondsToFirstAction} onChange={(event) => update('secondsToFirstAction', event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text" /></label><label className="grid gap-1 text-xs text-vault-text-dim">Biggest friction<select value={form.friction} onChange={(event) => update('friction', event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text">{['none', 'setup', 'action-choice', 'odds', 'resolution', 'result'].map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{[['completedFirstAction', 'Completed first action unaided'], ['understoodGoal', 'Could explain the win condition'], ['noticedGadget', 'Noticed the gadget effect'], ['wantedReplay', 'Asked to replay or continue']].map(([key, label]) => <label key={key} className="flex min-h-[48px] items-center gap-3 rounded border border-vault-border bg-vault-dark/55 px-3 text-sm text-vault-text"><input type="checkbox" checked={form[key]} onChange={(event) => update(key, event.target.checked)} />{label}</label>)}</div>
          <label className="mt-4 grid gap-1 text-xs text-vault-text-dim">Most delightful observed moment<select value={form.delightMoment} onChange={(event) => update('delightMoment', event.target.value)} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 text-vault-text">{DELIGHT_MOMENTS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={save} className="mt-4 min-h-[46px] bg-oxide-green px-5 font-mono text-xs font-bold uppercase text-vault-dark">Save observation</button>
        </div>
        <aside className="grid grid-cols-2 gap-2"><EvidenceMetric label="Sessions" value={summary.count} /><EvidenceMetric label="Goal clear" value={`${summary.goalRate}%`} /><EvidenceMetric label="Gadget seen" value={`${summary.gadgetRate}%`} /><EvidenceMetric label="Would replay" value={`${summary.replayRate}%`} /><EvidenceMetric label="First move" value={`${summary.averageSeconds}s`} /><EvidenceMetric label="Balance samples" value={telemetry.samples} /></aside>
      </div>
    </section>
  );
}

function EvidenceMetric({ label, value }) {
  return <div className="rounded border border-vault-border bg-vault-dark/60 p-3"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-vault-text-dim">{label}</p><p className="mt-2 font-display text-2xl text-vault-text">{value}</p></div>;
}
