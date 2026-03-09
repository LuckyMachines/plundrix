import { queueLabel } from '../../lib/formatting';

const QUEUE_CLASSNAMES = {
  open: 'border-blueprint/35 bg-blueprint/10 text-blueprint',
  mixed: 'border-tungsten/35 bg-tungsten/10 text-tungsten',
  agent_ladder: 'border-oxide-green/35 bg-oxide-green/10 text-oxide-green',
};

export default function QueuePill({ queue = 'open' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-mono uppercase tracking-[0.18em] ${
        QUEUE_CLASSNAMES[queue] || QUEUE_CLASSNAMES.open
      }`}
    >
      {queueLabel(queue)}
    </span>
  );
}
