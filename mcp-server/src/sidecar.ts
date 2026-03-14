import express from 'express';
import { paymentMiddlewareFromConfig } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { mcpConfig } from './config.js';
import { initSigner } from './contract-write.js';
import routes from './sidecar/routes.js';
import { routePayments } from './sidecar/payment-config.js';

const app = express();
app.use(express.json());

// Initialize relay signer
const signerAddress = initSigner();
console.error(`[plundrix-sidecar] Relay signer: ${signerAddress}`);

// Apply x402 payment middleware
app.use(
  paymentMiddlewareFromConfig(
    routePayments,
    undefined,
    [{ network: 'eip155:84532' as const, server: new ExactEvmScheme() as any }],
  )
);

// Mount route handlers
app.use(routes);

const port = mcpConfig.sidecarPort;
app.listen(port, () => {
  console.error(`[plundrix-sidecar] Listening on port ${port}`);
  console.error(`[plundrix-sidecar] Payment chain: ${mcpConfig.paymentChainId}`);
  console.error(`[plundrix-sidecar] Facilitator: ${mcpConfig.facilitatorUrl}`);
});
