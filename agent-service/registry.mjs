import { readFileSync } from 'node:fs';
import { isAddress } from 'viem';
import { agentConfig } from './config.mjs';

const EMPTY_REGISTRY = {
  profiles: [],
};

export function normalizeProfileType(value) {
  switch ((value || 'human').toLowerCase()) {
    case 'agent':
      return 'agent';
    case 'bot':
      return 'bot';
    default:
      return 'human';
  }
}

export function loadPlayerRegistry() {
  try {
    const raw = JSON.parse(readFileSync(agentConfig.playerRegistryPath, 'utf8'));
    const profiles = Array.isArray(raw?.profiles) ? raw.profiles : [];

    return {
      profiles: profiles
        .filter((entry) => isAddress(entry?.address))
        .map((entry) => ({
          address: entry.address,
          displayName:
            typeof entry.displayName === 'string' && entry.displayName.trim() !== ''
              ? entry.displayName.trim()
              : null,
          type: normalizeProfileType(entry.type),
          team:
            typeof entry.team === 'string' && entry.team.trim() !== ''
              ? entry.team.trim()
              : null,
          bio:
            typeof entry.bio === 'string' && entry.bio.trim() !== ''
              ? entry.bio.trim()
              : null,
          labels: Array.isArray(entry.labels)
            ? entry.labels.filter((label) => typeof label === 'string' && label.trim() !== '')
            : [],
        })),
    };
  } catch {
    return EMPTY_REGISTRY;
  }
}

export function buildRegistryMap(registry) {
  return new Map(
    registry.profiles.map((profile) => [profile.address.toLowerCase(), profile])
  );
}

export function getRegisteredProfile(registryMap, address) {
  return registryMap.get(address.toLowerCase()) || null;
}
