const STAGE_COPY = Object.freeze({
  vault: { eyebrow: 'Five-lock mechanism', status: 'Table armed' },
  route: { eyebrow: 'Route board', status: 'Three ways in' },
  dossier: { eyebrow: 'Operator dossier', status: 'Record current' },
  crew: { eyebrow: 'Crew table', status: 'Seats held' },
});

export default function CaperArtifactStage({ kind = 'vault', label, status, compact = false, className = '' }) {
  const copy = STAGE_COPY[kind] || STAGE_COPY.vault;
  const stageLabel = label || copy.eyebrow;
  const stageStatus = status || copy.status;

  return (
    <figure
      className={`caper-artifact-stage caper-artifact-stage--${kind}${compact ? ' caper-artifact-stage--compact' : ''} ${className}`.trim()}
      role="img"
      aria-label={`${stageLabel}. ${stageStatus}.`}
    >
      <span className="caper-artifact-stage__grid" aria-hidden="true" />
      <span className="caper-artifact-stage__trace" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="caper-artifact-stage__mechanism" aria-hidden="true">
        <i /><i /><i /><i /><i />
        <b />
      </span>
      <figcaption>
        <span>{stageLabel}</span>
        <strong>{stageStatus}</strong>
      </figcaption>
    </figure>
  );
}
