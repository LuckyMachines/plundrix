import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveIntegratedSession } from '../lib/gameIntegration';

export function useIntegratedSession(inputs) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastSoundRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const session = useMemo(
    () => deriveIntegratedSession({ ...inputs, nowMs }),
    [inputs, nowMs]
  );

  useEffect(() => {
    const latest = session.soundCueQueue;
    if (latest.length === 0) return;
    const previous = lastSoundRef.current.join('|');
    const current = latest.join('|');
    if (previous === current) return;
    lastSoundRef.current = latest;

    window.dispatchEvent(
      new CustomEvent('plundrix:sound-cues', {
        detail: {
          gameId: session.gameId,
          round: session.currentRound,
          cues: latest,
          latestCue: session.latestCue,
        },
      })
    );
  }, [session]);

  return session;
}
