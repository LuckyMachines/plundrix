import { useAccount } from 'wagmi';

export default function FooterNetworkStatus() {
  const { chain, isConnected } = useAccount();
  return isConnected && chain
    ? `${chain.name} // Chain ${chain.id}`
    : 'Sepolia beta // Wallet disconnected';
}
