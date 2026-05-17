import { MAX_TOOLS } from '../../lib/constants';

function recommendAction({ connected, registered, actionSubmitted, stunned, tools }) {
  if (!connected) {
    return 'Connect your wallet to take a turn.';
  }
  if (!registered) {
    return 'You are spectating. Join during OPEN state to play this game.';
  }
  if (actionSubmitted) {
    return 'Action committed. Wait for all players or timeout, then resolve.';
  }
  if (stunned) {
    return 'You are stunned this round. SEARCH is the safest recovery move.';
  }
  if (Number(tools) >= 3) {
    return 'High pick odds detected. PICK is favored this round.';
  }
  if (Number(tools) === 0) {
    return 'No tools online. SEARCH to improve future pick success.';
  }
  if (Number(tools) >= MAX_TOOLS) {
    return 'Tool tray is full. Convert pressure with PICK or disrupt with SABOTAGE.';
  }
  return 'Balanced board. PICK for progress, SEARCH for setup, or SABOTAGE to slow a rival.';
}

function getSessionReadout(session) {
  if (!session) return null;
  if (session.commandAvailability?.blockedReason) {
    const reason = session.commandAvailability.blockedReason;
    const labels = {
      config: 'Contract configuration is blocking commands.',
      wallet: 'Wallet connection is blocking commands.',
      spectator: 'Spectator status is blocking commands.',
      submitted: 'Action already submitted.',
      transaction: 'Transaction is still in flight.',
      stunned: 'Stunned posture blocks picking.',
    };
    return labels[reason] || `Command blocked: ${reason}.`;
  }
  if (session.canResolve) return 'Round can be resolved.';
  if (session.pressure?.stage === 'critical') return 'Timer is critical.';
  if (session.pressure?.stage === 'urgent') return 'Timer is urgent.';
  if (session.latestRoundSummary?.winner) return 'Vault breach recorded.';
  if (session.recommendedIntent && session.recommendedIntent !== 'idle') {
    return `Recommended intent: ${session.recommendedIntent.toUpperCase()}.`;
  }
  return null;
}

export default function MissionCoach({
  connected,
  registered,
  actionSubmitted,
  stunned,
  tools,
  canResolve,
  allSubmitted,
  session,
}) {
  const recommendation = recommendAction({
    connected,
    registered,
    actionSubmitted,
    stunned,
    tools,
  });
  const readout = getSessionReadout(session);

  return (
    <div className="alive-mission-coach border border-blueprint/30 rounded bg-blueprint/5 p-4 space-y-2" data-mode={session?.mode || 'steady'}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xs uppercase tracking-[0.3em] text-blueprint">
          Tactical Guidance
        </h3>
        {canResolve && (
          <span className="font-mono text-xs uppercase tracking-wider text-blueprint border border-blueprint/40 bg-blueprint/10 rounded px-2 py-0.5">
            {allSubmitted ? 'Resolve Now' : 'Resolve On Timeout'}
          </span>
        )}
      </div>
      <p className="font-mono text-sm text-vault-text">{recommendation}</p>
      {readout && (
        <p className="font-mono text-xs text-blueprint">{readout}</p>
      )}
      <p className="font-mono text-xs text-vault-text-dim">
        Shortcuts: <span className="text-vault-text">1</span> pick,{' '}
        <span className="text-vault-text">2</span> search,{' '}
        <span className="text-vault-text">3</span> target,{' '}
        <span className="text-vault-text">R</span> resolve.
      </p>
    </div>
  );
}
