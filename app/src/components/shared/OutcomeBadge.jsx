const TONES = {
  tungsten: 'text-tungsten border-tungsten/30 bg-tungsten/5',
  oxide: 'text-oxide-green border-oxide-green/30 bg-oxide-green/5',
  danger: 'text-signal-red border-signal-red/30 bg-signal-red/5',
  blueprint: 'text-blueprint border-blueprint/30 bg-blueprint/5',
  neutral: 'text-vault-text-dim border-vault-border bg-vault-panel',
};

export default function OutcomeBadge({ tone = 'neutral', children }) {
  return (
    <span className={`font-display text-xs tracking-widest uppercase px-2 py-0.5 rounded border ${TONES[tone] || TONES.neutral}`}>
      {children}
    </span>
  );
}
