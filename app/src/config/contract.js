import PlundrixGameABI from './PlundrixGame.json';
import { isAddress, zeroAddress } from 'viem';

export const PLUNDRIX_ABI = PlundrixGameABI;
const configuredAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

export const PLUNDRIX_ADDRESS = isAddress(configuredAddress)
  ? configuredAddress
  : zeroAddress;
export const IS_CONTRACT_CONFIGURED = isAddress(configuredAddress);
export const CONTRACT_CONFIG_ERROR = IS_CONTRACT_CONFIGURED
  ? null
  : 'Missing or invalid VITE_CONTRACT_ADDRESS in app/.env';
