const COMMANDS = [
  ['pick', '1', 'Pick'],
  ['search', '2', 'Search'],
  ['sabotage', '3', 'Sabotage'],
  ['cycleTarget', 'T', 'Target'],
  ['resolve', 'R', 'Resolve'],
  ['replay', '[ ]', 'Replay'],
  ['help', '?', 'Help'],
];

export default function CommandStrip({ session, onHelp }) {
  const available = session?.commandAvailability || {};

  return (
    <div className="alive-command-strip flex flex-wrap gap-2">
      {COMMANDS.map(([key, shortcut, label]) => {
        const enabled = available[key] !== false;
        return (
          <button
            key={key}
            type="button"
            disabled={!enabled}
            onClick={() => {
              if (key === 'help') onHelp?.();
            }}
            className={`rounded border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
              enabled
                ? 'border-vault-border bg-vault-dark/40 text-vault-text-dim hover:text-vault-text'
                : 'border-vault-border bg-vault-dark/20 text-vault-text-dim/50 cursor-not-allowed'
            }`}
          >
            <span className="text-vault-text">{shortcut}</span> {label}
          </button>
        );
      })}
    </div>
  );
}
