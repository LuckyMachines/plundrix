export default function IntegrationDebugTrace({ session }) {
  if (!import.meta.env.DEV || !session) return null;

  return (
    <details className="border border-vault-border rounded bg-vault-dark/50 p-3">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
        Integration Trace
      </summary>
      <pre className="mt-3 max-h-72 overflow-auto rounded bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-vault-text-dim">
        {JSON.stringify(
          {
            mode: session.mode,
            pressure: session.pressure,
            playerStatus: session.playerStatus,
            commandAvailability: session.commandAvailability,
            latestCue: session.latestCue,
            soundCueQueue: session.soundCueQueue,
          },
          null,
          2
        )}
      </pre>
    </details>
  );
}
