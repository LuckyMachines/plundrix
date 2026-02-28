import { createConfig, http } from 'wagmi';
import { sepolia, foundry } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const foundryRpcUrl = import.meta.env.VITE_FOUNDRY_RPC_URL || 'http://127.0.0.1:18645';
const enableFoundry =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_FOUNDRY === 'true';

export const supportedChains = enableFoundry ? [foundry, sepolia] : [sepolia];
export const defaultSwitchChainId = enableFoundry ? foundry.id : sepolia.id;

const transports = {
  [sepolia.id]: http(import.meta.env.VITE_RPC_URL || undefined),
  ...(enableFoundry ? { [foundry.id]: http(foundryRpcUrl) } : {}),
};

export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports,
});
