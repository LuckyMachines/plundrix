import { useEffect } from 'react';

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;
}

export function useSessionCommandLayer({
  session,
  players = [],
  currentAddress,
  targetAddress,
  onResolve,
  onTargetChange,
  resolveDisabled = false,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('plundrix:open-help', { detail: { tab: 'actions' } }));
        window.dispatchEvent(new CustomEvent('plundrix:command', { detail: { command: 'help' } }));
        return;
      }

      if (key === 'r') {
        if (!session?.commandAvailability?.resolve || resolveDisabled) return;
        e.preventDefault();
        onResolve?.();
        window.dispatchEvent(new CustomEvent('plundrix:command', { detail: { command: 'resolve' } }));
        return;
      }

      if (key === 't') {
        const targets = players.filter(
          (addr) => addr?.toLowerCase() !== currentAddress?.toLowerCase()
        );
        if (targets.length === 0 || !session?.commandAvailability?.cycleTarget) return;
        e.preventDefault();
        const currentIndex = targets.findIndex(
          (addr) => addr?.toLowerCase() === targetAddress?.toLowerCase()
        );
        const next = targets[(currentIndex + 1) % targets.length];
        onTargetChange?.(next);
        window.dispatchEvent(new CustomEvent('plundrix:command', { detail: { command: 'cycleTarget', target: next } }));
        return;
      }

      if (key === 'escape' && targetAddress) {
        e.preventDefault();
        onTargetChange?.('');
        window.dispatchEvent(new CustomEvent('plundrix:command', { detail: { command: 'clearTarget' } }));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    session?.commandAvailability?.resolve,
    session?.commandAvailability?.cycleTarget,
    players,
    currentAddress,
    targetAddress,
    onResolve,
    onTargetChange,
    resolveDisabled,
  ]);
}
