/**
 * x402 payment configuration for each write endpoint.
 * Prices are in USDC on Base Sepolia (eip155:84532).
 *
 * These cover estimated gas costs with a margin:
 * - createGame: ~150k gas ≈ $0.016 → charge $0.10
 * - registerPlayer: ~80k gas ≈ $0.008 → charge $0.04
 * - submitAction: ~100k gas ≈ $0.010 → charge $0.06
 * - resolveRound: ~200k gas ≈ $0.021 → charge $0.10
 */

const PAY_TO = '0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79';
const NETWORK = 'eip155:84532' as const;

export const routePayments = {
  'POST /tx/create-game': {
    accepts: {
      scheme: 'exact',
      network: NETWORK,
      payTo: PAY_TO,
      price: '$0.10',
      maxTimeoutSeconds: 300,
    },
    description: 'Create a new Plundrix game',
  },
  'POST /tx/register-player': {
    accepts: {
      scheme: 'exact',
      network: NETWORK,
      payTo: PAY_TO,
      price: '$0.04',
      maxTimeoutSeconds: 300,
    },
    description: 'Register as a player in a game',
  },
  'POST /tx/submit-action': {
    accepts: {
      scheme: 'exact',
      network: NETWORK,
      payTo: PAY_TO,
      price: '$0.06',
      maxTimeoutSeconds: 300,
    },
    description: 'Submit a game action',
  },
  'POST /tx/resolve-round': {
    accepts: {
      scheme: 'exact',
      network: NETWORK,
      payTo: PAY_TO,
      price: '$0.10',
      maxTimeoutSeconds: 300,
    },
    description: 'Resolve a timed-out round',
  },
} as const;
