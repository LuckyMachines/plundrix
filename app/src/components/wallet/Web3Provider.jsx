import { WagmiProvider } from 'wagmi';
import { config } from '../../config/wagmi';

export default function Web3Provider({ children }) {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
