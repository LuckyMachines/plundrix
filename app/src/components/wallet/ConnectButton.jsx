import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { trackProductEvent } from '../../lib/analytics';
import { useToast } from '../../context/ToastContext';

function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectButton() {
  const toast = useToast();
  const { address, isConnected } = useAccount();
  const { connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!error) return;
    toast.error(error.shortMessage || error.message || 'The wallet could not connect.', {
      title: 'Connection failed',
    });
  }, [error]);

  if (isConnected) {
    return (
      <button
        onClick={() => {
          trackProductEvent('Wallet Disconnected', { surface: 'header' });
          disconnect();
        }}
        className="
          border border-vault-border bg-vault-panel
          hover:bg-vault-surface hover:border-tungsten/40
          text-vault-text font-mono text-xs tracking-wider
          px-4 py-2 rounded
          transition-colors duration-150 cursor-pointer
        "
      >
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <button
      aria-label="Connect wallet"
      onClick={() => {
        trackProductEvent('Wallet Connect Started', { surface: 'header' });
        connect({ connector: injected() });
      }}
      disabled={isPending}
      className="
        border border-tungsten/50 bg-vault-panel
        hover:bg-tungsten/10 hover:border-tungsten
        text-tungsten font-display font-semibold text-sm tracking-widest uppercase
        px-5 py-2 rounded
        transition-colors duration-150 cursor-pointer disabled:cursor-wait disabled:opacity-60
      "
    >
      {isPending ? 'Connecting...' : 'Connect'}
    </button>
  );
}
