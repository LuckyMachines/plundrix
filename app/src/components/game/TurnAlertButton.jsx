import { useEffect, useRef } from 'react';
import { usePreferences } from '../../context/AccessibilityContext';

export default function TurnAlertButton({ currentRound, gameState, actionSubmitted }) {
  const { backgroundTurnAlerts, notificationPermission, setBackgroundTurnAlerts } = usePreferences();
  const supported = notificationPermission !== 'unsupported';
  const enabled = supported && notificationPermission === 'granted' && backgroundTurnAlerts;
  const previousRound = useRef(currentRound);
  const previousState = useRef(gameState);

  useEffect(() => {
    const roundAdvanced = Number(currentRound) > Number(previousRound.current || 0);
    const completed = previousState.current !== gameState && Number(gameState) === 2;
    if (enabled && document.hidden && (roundAdvanced || completed)) {
      new Notification(completed ? 'Plundrix operation complete' : `Round ${currentRound} is ready`, {
        body: completed ? 'Return for the final briefing.' : actionSubmitted ? 'The table resolved. Make your next move.' : 'The next decision window is open.',
        icon: '/favicon.svg',
      });
    }
    previousRound.current = currentRound;
    previousState.current = gameState;
  }, [actionSubmitted, currentRound, enabled, gameState]);

  if (!supported) return null;

  return (
    <button type="button" onClick={() => setBackgroundTurnAlerts(!enabled)} aria-pressed={enabled} className="min-h-[44px] border border-vault-border bg-vault-dark/45 px-3 text-left font-mono text-micro uppercase tracking-interface text-vault-text-dim hover:text-vault-text">
      Background turn alerts: <span className={enabled ? 'text-oxide-green' : 'text-vault-text'}>{enabled ? 'on' : 'off'}</span>
    </button>
  );
}
