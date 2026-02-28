import { useAccount, useSwitchChain } from 'wagmi';
import { defaultSwitchChainId, supportedChains } from '../../config/wagmi';

export default function NetworkBadge() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-vault-text-dim">
        <span className="inline-block w-2 h-2 rounded-full bg-signal-red shadow-[0_0_4px_var(--color-signal-red)]" />
        <span className="tracking-wider uppercase">Disconnected</span>
      </div>
    );
  }

  const isSupported =
    chain && supportedChains.some((supported) => supported.id === chain.id);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`
          inline-block w-2 h-2 rounded-full
          ${isSupported ? 'bg-oxide-green shadow-[0_0_4px_var(--color-oxide-green)]' : 'bg-signal-red shadow-[0_0_4px_var(--color-signal-red)]'}
        `}
      />

      {isSupported ? (
        <select
          value={chain?.id ?? defaultSwitchChainId}
          onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
          disabled={isPending}
          className="
            bg-transparent border border-vault-border rounded
            text-xs font-mono text-vault-text-dim tracking-wider uppercase
            px-2 py-1 cursor-pointer
            hover:border-tungsten/40 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          {supportedChains.map((supported) => (
            <option
              key={supported.id}
              value={supported.id}
              className="bg-vault-dark text-vault-text"
            >
              {supported.name}
            </option>
          ))}
        </select>
      ) : (
        <button
          onClick={() => switchChain({ chainId: defaultSwitchChainId })}
          disabled={isPending}
          className="
            border border-signal-red/50 bg-signal-red/10 rounded
            text-xs font-mono text-signal-red tracking-wider uppercase
            px-3 py-1 cursor-pointer
            hover:bg-signal-red/20 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          {isPending ? 'Switching...' : 'Switch Network'}
        </button>
      )}
    </div>
  );
}
