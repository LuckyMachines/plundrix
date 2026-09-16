import { useEffect, useMemo, useState } from 'react';
import { DELIGHT_MOMENTS, SETTINGS_TASKS, readObservations, saveObservation, summarizeObservations } from '../../lib/observationStore';
import { readBalanceTelemetry } from '../../lib/gadgetTelemetry';
import { emitPresentationCues } from '../../data/presentationDirector';
import { AUDIO_TEST_MODES, PREMIUM_PLAYTEST_PROTOCOL } from '../../data/premiumPlaytestProtocol';

const INITIAL = {
  participantCode: 'P-01', observerConfirmed: false, returningPlayer: false, completedFirstAction: false,
  understoodGoal: false, understoodWhy: false, noticedGadget: false, wantedReplay: false, foundSettings: false,
  completedSettingsTask: false, understoodSettingsPersistence: false, recognizedAction3s: false,
  recognizedTarget3s: false, recognizedOutcome3s: false, soundIdentityCorrect: false, audioMode: 'sampled',
  preferredAudio: 'no-preference', impactScore: 3, settingsTask: 'not-tested', joyScore: 3,
  delightMoment: 'none-yet', friction: 'none', secondsToFirstAction: 0, secondsToSettings: 0,
};

const CHECKS = [
  ['completedFirstAction', 'Completed first action unaided'], ['understoodGoal', 'Could explain the win condition'],
  ['understoodWhy', 'Could explain why the result happened'], ['noticedGadget', 'Noticed the gadget effect'],
  ['recognizedAction3s', 'Named the action after three seconds'], ['recognizedTarget3s', 'Named the affected target after three seconds'],
  ['recognizedOutcome3s', 'Named the outcome after three seconds'], ['soundIdentityCorrect', 'Identified the action from sound alone'],
  ['wantedReplay', 'Asked to replay or continue'], ['returningPlayer', 'Returning player'],
  ['foundSettings', 'Found settings without prompting'], ['completedSettingsTask', 'Completed the assigned settings task'],
  ['understoodSettingsPersistence', 'Understood that changes save locally'],
];

function downloadEvidence(records) {
  const blob = new Blob([JSON.stringify({ schemaVersion: 3, evidenceTier: 'T3', captureMethod: 'facilitated-observation', exportedAt: new Date().toISOString(), anonymous: true, records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plundrix-premium-playtest-observations.json';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ObservationRecorder() {
  const [form, setForm] = useState(INITIAL);
  const [records, setRecords] = useState(readObservations);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const summary = useMemo(() => summarizeObservations(records), [records]);
  const telemetry = readBalanceTelemetry();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!timerStartedAt) return undefined;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - timerStartedAt) / 1000));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [timerStartedAt]);

  const startTimer = () => {
    setTimerStartedAt(Date.now());
    setElapsedSeconds(0);
  };
  const markFirstAction = () => {
    update('secondsToFirstAction', elapsedSeconds);
    update('completedFirstAction', true);
  };
  const save = () => {
    const next = saveObservation(form);
    setRecords(next);
    setForm((current) => ({ ...INITIAL, audioMode: current.audioMode, participantCode: `P-${String(next.length + 1).padStart(2, '0')}` }));
    setTimerStartedAt(null);
    setElapsedSeconds(0);
  };
  const audition = (mode) => {
    update('audioMode', mode);
    emitPresentationCues(['intent.sabotage', 'sabotage.hit'], { source: 'playtest-audition', mode });
  };

  return (
    <section className="playtest-observation-suite rounded border border-oxide-green/35 bg-oxide-green/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="label text-oxide-green">Real-player evidence / {Math.min(records.length, 4)} of 4 sessions</p><h2 className="mt-2 font-display text-3xl text-vault-text">Premium perception protocol</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-vault-text-dim">A ten-minute, one-person-friendly script. Record behavior, not identity; entries stay on this device until export.</p></div>
        <button type="button" onClick={() => downloadEvidence(records)} disabled={!records.length} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase text-vault-text disabled:opacity-40">Export anonymous JSON</button>
      </div>

      <ol className="playtest-protocol mt-5 grid gap-2 lg:grid-cols-5" aria-label="Ten minute test protocol">
        {PREMIUM_PLAYTEST_PROTOCOL.map((step) => <li key={step.minute}><span>{step.minute}</span><strong>{step.task}</strong><p>{step.prompt}</p><small>{step.proof}</small></li>)}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3 border border-blueprint/35 bg-blueprint/5 p-3" aria-label="Playtest timer">
        <span className="font-mono text-sm tabular-nums text-blueprint">{String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}</span>
        <button type="button" onClick={startTimer} className="min-h-[44px] border border-blueprint/45 px-4 font-mono text-xs uppercase text-blueprint">{timerStartedAt ? 'Restart timer' : 'Start session timer'}</button>
        <button type="button" onClick={markFirstAction} disabled={!timerStartedAt || form.completedFirstAction} className="min-h-[44px] border border-oxide-green/45 px-4 font-mono text-xs uppercase text-oxide-green disabled:opacity-40">{form.completedFirstAction ? `First action: ${form.secondsToFirstAction}s` : 'Mark first action'}</button>
        <p className="text-xs text-vault-text-dim">Do not explain the first choice. Mark the moment the player commits.</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Participant code"><input value={form.participantCode} onChange={(event) => update('participantCode', event.target.value)} /></Field>
            <Field label="Seconds to first action"><input type="number" min="0" max="900" value={form.secondsToFirstAction} onChange={(event) => update('secondsToFirstAction', event.target.value)} /></Field>
            <Field label="Seconds to settings"><input type="number" min="0" max="900" value={form.secondsToSettings} onChange={(event) => update('secondsToSettings', event.target.value)} /></Field>
            <Field label="Biggest friction"><select value={form.friction} onChange={(event) => update('friction', event.target.value)}>{['none', 'setup', 'action-choice', 'odds', 'resolution', 'result', 'menu', 'settings'].map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>

          <div className="playtest-audio-lab mt-4">
            <div><p className="label">Blind sound check</p><p>Play the current mix without showing its label. Ask what happened, then whether it sounded clean.</p></div>
            <div>{AUDIO_TEST_MODES.map((mode) => <button key={mode} type="button" data-selected={form.audioMode === mode} onClick={() => audition(mode)}>Play current mix</button>)}</div>
            <Field label="Sound verdict"><select value={form.preferredAudio} onChange={(event) => update('preferredAudio', event.target.value)}>{[...AUDIO_TEST_MODES, 'no-preference'].map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">{CHECKS.map(([key, label]) => <label key={key} className="flex min-h-[48px] items-center gap-3 rounded border border-vault-border bg-vault-dark/55 px-3 text-sm text-vault-text"><input type="checkbox" checked={form[key]} onChange={(event) => update(key, event.target.checked)} />{label}</label>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Observed joy, 1-5"><select value={form.joyScore} onChange={(event) => update('joyScore', Number(event.target.value))}>{[1, 2, 3, 4, 5].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Perceived impact, 1-5"><select value={form.impactScore} onChange={(event) => update('impactScore', Number(event.target.value))}>{[1, 2, 3, 4, 5].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Most delightful moment"><select value={form.delightMoment} onChange={(event) => update('delightMoment', event.target.value)}>{DELIGHT_MOMENTS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Settings task"><select value={form.settingsTask} onChange={(event) => update('settingsTask', event.target.value)}>{SETTINGS_TASKS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
          <label className="mt-4 flex min-h-[48px] items-center gap-3 rounded border border-tungsten/40 bg-tungsten/5 px-3 text-sm text-vault-text"><input type="checkbox" checked={form.observerConfirmed} onChange={(event) => update('observerConfirmed', event.target.checked)} />I personally observed this player session.</label>
          <button type="button" onClick={save} disabled={!form.observerConfirmed} className="mt-4 min-h-[46px] bg-oxide-green px-5 font-mono text-xs font-bold uppercase text-vault-dark disabled:cursor-not-allowed disabled:opacity-40">Save verified observation</button>
        </div>
        <aside className="grid grid-cols-2 gap-2">
          <EvidenceMetric label="Sessions" value={`${Math.min(summary.count, 4)}/4`} /><EvidenceMetric label="Goal clear" value={`${summary.goalRate}%`} />
          <EvidenceMetric label="Action in 3s" value={`${summary.actionRecognitionRate}%`} /><EvidenceMetric label="Target in 3s" value={`${summary.targetRecognitionRate}%`} />
          <EvidenceMetric label="Outcome in 3s" value={`${summary.outcomeRecognitionRate}%`} /><EvidenceMetric label="Sound ID" value={`${summary.soundIdentityRate}%`} />
          <EvidenceMetric label="Gadget seen" value={`${summary.gadgetRate}%`} /><EvidenceMetric label="Would replay" value={`${summary.replayRate}%`} />
          <EvidenceMetric label="First move" value={`${summary.averageSeconds}s`} /><EvidenceMetric label="Average impact" value={`${summary.averageImpact}/5`} />
          <EvidenceMetric label="Average joy" value={`${summary.averageJoy}/5`} /><EvidenceMetric label="Balance samples" value={telemetry.samples} />
        </aside>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return <label className="grid gap-1 text-xs text-vault-text-dim">{label}<span className="playtest-field">{children}</span></label>;
}

function EvidenceMetric({ label, value }) {
  return <div className="rounded border border-vault-border bg-vault-dark/60 p-3"><p className="font-mono text-micro uppercase tracking-interface text-vault-text-dim">{label}</p><p className="mt-2 font-display text-2xl text-vault-text">{value}</p></div>;
}
