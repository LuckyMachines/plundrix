import {
  Action,
  ACTION_LABELS,
  OUTCOME_REASON_LABELS,
  OutcomeReason,
} from './constants';
import { truncateAddress } from './formatting';

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  return Number(value);
}

export function getOutcomeReasonLabel(reason) {
  const reasonId = toNumber(reason, OutcomeReason.NONE);
  return OUTCOME_REASON_LABELS[reasonId] || 'Outcome recorded';
}

export function getActionLabel(action) {
  const actionId = toNumber(action, Action.NONE);
  return ACTION_LABELS[actionId] || 'Action';
}

export function describeActionOutcome(args, currentAddress) {
  const player = args?.player;
  const playerLabel =
    player?.toLowerCase() === currentAddress?.toLowerCase()
      ? 'You'
      : truncateAddress(player);

  const actionLabel = getActionLabel(args?.action);
  const reasonLabel = getOutcomeReasonLabel(args?.reason);
  const locks = args?.locksCracked?.toString?.() ?? '0';
  const tools = args?.tools?.toString?.() ?? '0';

  return `${playerLabel}: ${actionLabel} -> ${reasonLabel} (locks ${locks}, tools ${tools})`;
}
