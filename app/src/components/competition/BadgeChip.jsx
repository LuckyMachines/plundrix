export default function BadgeChip({ badge }) {
  return (
    <span className="inline-flex items-center rounded-full border border-tungsten/35 bg-tungsten/10 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-tungsten">
      {badge.label}
    </span>
  );
}
