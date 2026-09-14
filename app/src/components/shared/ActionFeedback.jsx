import { useEffect, useState } from 'react';
import Spinner from './Spinner';

const DEFAULT_STAGES = [
  { after: 0, label: 'Preparing the operation' },
  { after: 1400, label: 'Briefing the crew' },
  { after: 3800, label: 'Opening the table' },
  { after: 8000, label: 'Still working - keep this window open' },
];

export function useActionStage(active, stages = DEFAULT_STAGES) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return undefined;
    }
    const startedAt = Date.now();
    const tick = () => setElapsed(Date.now() - startedAt);
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [active]);

  const activeIndex = active
    ? Math.max(0, stages.findLastIndex((stage) => elapsed >= stage.after))
    : 0;

  return { activeIndex, elapsed, label: stages[activeIndex]?.label || stages[0]?.label || 'Working' };
}

export function ActionButtonContent({ active, idle, stages = DEFAULT_STAGES }) {
  const stage = useActionStage(active, stages);
  if (!active) return idle;

  return (
    <span className="action-button-feedback" role="status" aria-live="polite">
      <Spinner size="h-4 w-4" />
      <span>{stage.label}</span>
      <span className="action-button-feedback__dots" aria-hidden="true"><i /><i /><i /></span>
    </span>
  );
}

export function ActionWaitPanel({
  active = true,
  eyebrow = 'Operation in progress',
  stages = DEFAULT_STAGES,
  detail = 'Your command is safe. This panel will update as soon as the next state is ready.',
  compact = false,
  className = '',
}) {
  const stage = useActionStage(active, stages);
  const progress = [22, 54, 78, 92][Math.min(stage.activeIndex, 3)];

  return (
    <section className={`action-wait-panel ${compact ? 'action-wait-panel--compact' : ''} ${className}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="action-wait-panel__mechanism"><Spinner size="h-10 w-10" /></div>
      <div className="action-wait-panel__copy">
        <p>{eyebrow}</p>
        <strong>{stage.label}</strong>
        <small>{detail}</small>
        <div className="action-wait-panel__track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      </div>
      <ol className="action-wait-panel__stages" aria-label="Progress">
        {stages.slice(0, 3).map((item, index) => (
          <li key={`${item.after}-${item.label}`} data-state={index < stage.activeIndex ? 'complete' : index === stage.activeIndex ? 'active' : 'waiting'}>
            <i />
            <span>{index + 1}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const ACTION_STAGE_PRESETS = Object.freeze({
  start: DEFAULT_STAGES,
  join: [
    { after: 0, label: 'Finding your seat' },
    { after: 1400, label: 'Joining the crew' },
    { after: 3800, label: 'Syncing the table' },
    { after: 8000, label: 'Still joining - keep this window open' },
  ],
  reveal: [
    { after: 0, label: 'Sealing your move' },
    { after: 900, label: 'Revealing the table' },
    { after: 2400, label: 'Reading the outcome' },
    { after: 6000, label: 'Still resolving - your move is safe' },
  ],
  create: [
    { after: 0, label: 'Opening a new table' },
    { after: 1600, label: 'Setting the round pace' },
    { after: 4200, label: 'Preparing your seat' },
    { after: 8000, label: 'Still opening - keep this window open' },
  ],
  workshop: [
    { after: 0, label: 'Checking the blueprint' },
    { after: 1200, label: 'Updating your collection' },
    { after: 3600, label: 'Polishing the build' },
    { after: 8000, label: 'Still working - your build is safe' },
  ],
});
