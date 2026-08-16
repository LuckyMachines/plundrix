import { useEffect, useRef, useState } from 'react';

const ALERT_KEY = 'plundrix-background-turn-alerts';

export default function TurnAlertButton({ currentRound, gameState, actionSubmitted }) {
  const supported = typeof Notification !== 'undefined';
  const [enabled, setEnabled] = useState(() => (
    supported && Notification.permission === 'granted' && localStorage.getItem(ALERT_KEY) === 'true'
  ));
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

  const toggle = async () => {
    if (enabled) {
      localStorage.setItem(ALERT_KEY, 'false');
      setEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    const next = permission === 'granted';
    localStorage.setItem(ALERT_KEY, String(next));
    setEnabled(next);
  };

  return (
    <button type="button" onClick={toggle} className="min-h-[44px] border border-vault-border bg-vault-dark/45 px-3 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-vault-text-dim hover:text-vault-text">
      Background turn alerts: <span className={enabled ? 'text-oxide-green' : 'text-vault-text'}>{enabled ? 'on' : 'off'}</span>
    </button>
  );
}
