import { profileTypeLabel } from '../../lib/formatting';

const TYPE_CLASSNAMES = {
  human: 'border-blueprint/35 bg-blueprint/10 text-blueprint',
  agent: 'border-oxide-green/35 bg-oxide-green/10 text-oxide-green',
  bot: 'border-tungsten/35 bg-tungsten/10 text-tungsten',
};

export default function TypePill({ type = 'human' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-mono uppercase tracking-[0.18em] ${
        TYPE_CLASSNAMES[type] || TYPE_CLASSNAMES.human
      }`}
    >
      {profileTypeLabel(type)}
    </span>
  );
}
