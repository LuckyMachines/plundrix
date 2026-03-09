export function truncateAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatBigInt(value) {
  if (value === undefined || value === null) return '0';
  return Number(value).toString();
}

export function formatTimeRemaining(roundStartTime, timeout = 300) {
  if (!roundStartTime) return '--:--';
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - Number(roundStartTime);
  const remaining = Math.max(0, timeout - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function pickChance(tools, stunned) {
  if (stunned) return 0;
  return Math.min(40 + Number(tools) * 15, 95);
}

export function searchChance(stunned) {
  return stunned ? 30 : 60;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Pending';
  return new Date(Number(timestamp) * 1000).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPercent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

export function queueLabel(queue) {
  switch (queue) {
    case 'agent_ladder':
      return 'Agent Ladder';
    case 'mixed':
      return 'Mixed Table';
    case 'open':
      return 'Open Table';
    default:
      return String(queue || 'Unknown');
  }
}

export function profileTypeLabel(type) {
  switch (type) {
    case 'agent':
      return 'Agent';
    case 'bot':
      return 'Bot';
    default:
      return 'Human';
  }
}
