import PlundrixGameABI from './PlundrixGame.json';
import PlundrixWorkshopABI from './PlundrixWorkshop.json';
import { isAddress, zeroAddress } from 'viem';

export const PLUNDRIX_ABI = PlundrixGameABI;
const configuredAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

export const PLUNDRIX_ADDRESS = isAddress(configuredAddress)
  ? configuredAddress
  : zeroAddress;
export const IS_CONTRACT_CONFIGURED = isAddress(configuredAddress);
export const PLUNDRIX_WORKSHOP_ABI = PlundrixWorkshopABI;
const configuredWorkshopAddress = import.meta.env.VITE_WORKSHOP_ADDRESS;
export const PLUNDRIX_WORKSHOP_ADDRESS = isAddress(configuredWorkshopAddress)
  ? configuredWorkshopAddress
  : zeroAddress;
export const IS_WORKSHOP_CONFIGURED = isAddress(configuredWorkshopAddress);
export const CONTRACT_CONFIG_ERROR = IS_CONTRACT_CONFIGURED
  ? null
  : 'Missing or invalid VITE_CONTRACT_ADDRESS in app/.env';
export const WORKSHOP_CONFIG_ERROR = IS_WORKSHOP_CONFIGURED
  ? null
  : 'Missing or invalid VITE_WORKSHOP_ADDRESS in app/.env';
export const SESSION_KEYS_ENABLED = import.meta.env.VITE_ENABLE_SESSION_KEYS === 'true';
export const NEXT_RULES_ENABLED = import.meta.env.VITE_ENABLE_NEXT_RULES === 'true';
export const SESSION_RELAY_URL = (
  import.meta.env.VITE_SESSION_RELAY_URL || import.meta.env.VITE_AGENT_SERVICE_URL || ''
).replace(/\/$/, '');
