const glyphs = {
  circle: <><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  needle: <><path d="M12 3v18M7 8l5-5 5 5" /><circle cx="12" cy="15" r="3" /></>,
  wave: <path d="M3 12c3-7 6 7 9 0s6 7 9 0" />,
  shield: <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />,
  hourglass: <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />,
  spark: <path d="m13 2-8 12h6l-1 8 9-13h-6V2Z" />,
  hush: <><path d="M4 9h10M4 15h10" /><path d="M18 7v10" /></>,
  anchor: <><path d="M12 3v16M8 7h8" /><path d="M4 14c1 5 4 7 8 7s7-2 8-7" /></>,
  chevron: <><path d="m5 8 7 7 7-7" /><path d="m5 3 7 7 7-7" /></>,
  patch: <><path d="M5 5h14v14H5z" /><path d="m5 10 5-5m4 14 5-5" /></>,
  diamond: <><path d="m12 2 9 10-9 10-9-10 9-10Z" /><path d="m8 12 3 3 5-6" /></>,
  orbit: <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(35 12 12)" /></>,
};

function CalibrationGlyph({ glyph }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {glyphs[glyph] || glyphs.circle}
    </svg>
  );
}

export default function GadgetVisual({ gadget, compact = false, className = '', masteryLevel = 0 }) {
  if (!gadget) return null;
  const style = {
    '--gadget-finish': gadget.finishColor,
    '--gadget-shadow': gadget.finishShadow,
    '--gadget-image': `url("${gadget.image}")`,
  };

  return (
    <div
      className={`gadget-visual gadget-visual--${gadget.finishPattern} gadget-visual--${gadget.rarity} ${masteryLevel > 1 ? 'gadget-visual--mastered' : ''} ${compact ? 'gadget-visual--compact' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={`${gadget.finishLabel} ${gadget.chassisLabel} with ${gadget.calibrationModule}`}
    >
      <div className="gadget-visual__grid" aria-hidden="true" />
      <div className="gadget-visual__halo" aria-hidden="true" />
      <img className="gadget-visual__base" src={gadget.image} alt="" width="512" height="512" loading="lazy" />
      <div className="gadget-visual__finish" aria-hidden="true" />
      <div className="gadget-visual__module" aria-hidden="true">
        <CalibrationGlyph glyph={gadget.calibrationGlyph} />
      </div>
      <div className="gadget-visual__rivets" aria-hidden="true"><i /><i /><i /></div>
      {gadget.isHero && <span className="gadget-visual__hero" aria-hidden="true">SIGNATURE</span>}
      {masteryLevel > 1 && <span className="gadget-visual__mastery" aria-hidden="true">M{masteryLevel}</span>}
    </div>
  );
}
