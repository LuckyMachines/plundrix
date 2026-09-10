export default function OperatorDossier({
  candidate,
  totalLocks,
  isCurrent = false,
  persona,
  portrait,
  chronicleEntry,
  taunt,
  tone = 'cyan',
}) {
  const status = candidate.stunned
    ? 'Stunned'
    : candidate.gadget && candidate.gadgetReady
      ? 'Gadget ready'
      : 'Ready';

  return (
    <article
      className="instant-player-card caper-layer caper-layer-information min-w-[220px] flex-1 snap-start p-4"
      data-current={isCurrent}
      data-status={candidate.stunned ? 'stunned' : 'ready'}
      data-tone={tone}
      aria-label={`${candidate.name}, ${candidate.locksCracked} of ${totalLocks} locks, ${candidate.tools} tools, ${status}`}
    >
      <div className="instant-dossier-tab" aria-hidden="true" />
      <div className="instant-dossier-heading">
        {portrait ? (
          <img
            src={portrait}
            alt=""
            width="384"
            height="384"
            className="instant-dossier-portrait h-14 w-14 shrink-0 object-contain"
          />
        ) : (
          <span className="instant-dossier-monogram" aria-hidden="true">
            {candidate.name.slice(0, 1)}
          </span>
        )}
        <span className="instant-dossier-identity">
          <span className="instant-dossier-name font-display text-xl uppercase text-vault-text">
            {candidate.name}
          </span>
          <span className="instant-dossier-meta">
            {isCurrent && <span className="instant-dossier-you">You</span>}
            <span className="instant-dossier-status" data-status={candidate.stunned ? 'stunned' : 'ready'}>
              <span aria-hidden="true" />
              {status}
            </span>
          </span>
        </span>
      </div>

      <div className="instant-dossier-locks" role="img" aria-label={`${candidate.locksCracked} of ${totalLocks} locks cracked`}>
        {Array.from({ length: totalLocks }, (_, index) => (
          <span key={index} data-state={index < candidate.locksCracked ? 'open' : 'sealed'} aria-hidden="true" />
        ))}
      </div>

      <p className="instant-dossier-stats font-mono text-micro uppercase tracking-interface text-vault-text-dim">
        <span>{candidate.locksCracked}/{totalLocks} locks</span>
        <span>{candidate.tools} tools</span>
      </p>

      {candidate.gadget && (
        <p className="instant-dossier-gadget mt-2 font-mono text-micro uppercase text-oxide-green">
          {candidate.gadget.replace('-', ' ')} / {candidate.gadgetReady ? 'ready' : 'spent'}
        </p>
      )}
      {(persona || chronicleEntry) && (
        <details className="instant-dossier-intel">
          <summary>Operator intel</summary>
          <div className="instant-player-detail">
            {persona && <p className="text-xs leading-5 text-vault-text-dim">{persona}</p>}
            {chronicleEntry && (
              <>
                <p className="mt-2 font-mono text-micro uppercase tracking-interface text-signal-red">
                  Grudge {'X'.repeat(chronicleEntry.grudge)}{'-'.repeat(5 - chronicleEntry.grudge)} / record {chronicleEntry.playerWins}-{chronicleEntry.rivalWins}
                </p>
                <p className="mt-1 text-xs italic leading-5 text-vault-text-dim">"{taunt}"</p>
              </>
            )}
          </div>
        </details>
      )}
    </article>
  );
}
