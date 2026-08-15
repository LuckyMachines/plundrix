import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

const STEPS = [
  ['Connect', 'Connect a wallet, then create a free operation or open an existing table.'],
  ['Assemble', 'Join with 2-4 operators. Any registered player can start when the crew is ready.'],
  ['Commit', 'Choose Pick, Search, or Sabotage. All choices resolve together each round.'],
];

export default function QuickStartPanel() {
  const { isConnected } = useAccount();

  return (
    <section className="border border-vault-border bg-vault-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vault-border px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-tungsten">First operation</p>
          <h2 className="mt-1 font-display text-2xl uppercase tracking-[0.06em] text-vault-text">From wallet to vault in three steps</h2>
        </div>
        <span className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
          isConnected ? 'border-oxide-green/40 bg-oxide-green/10 text-oxide-green' : 'border-vault-border text-vault-text-dim'
        }`}>
          {isConnected ? 'Wallet ready' : 'Wallet not connected'}
        </span>
      </div>

      <ol className="grid gap-px bg-vault-border md:grid-cols-3">
        {STEPS.map(([title, copy], index) => (
          <li key={title} className="bg-vault-surface p-5">
            <span className="font-mono text-[10px] tracking-[0.16em] text-vault-text-dim">0{index + 1}</span>
            <h3 className="mt-3 font-display text-xl uppercase tracking-[0.08em] text-vault-text">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-vault-text-dim">{copy}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <Link to="/simulator" className="inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten hover:bg-tungsten/10">
          Practice first
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('plundrix:open-help', { detail: { tab: 'how-to' } }))}
          className="min-h-[44px] px-3 font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim hover:text-vault-text"
        >
          Read field manual
        </button>
      </div>
    </section>
  );
}
