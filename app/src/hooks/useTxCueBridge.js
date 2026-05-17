import { useEffect, useRef } from 'react';
import { SOUND_CUES } from '../lib/gameIntegration';

export function useTxCueBridge({ gameId, label, isPending, isConfirming, isSuccess, error }) {
  const lastRef = useRef('');

  useEffect(() => {
    const state = error
      ? 'error'
      : isSuccess
        ? 'success'
        : isConfirming
          ? 'confirming'
          : isPending
            ? 'pending'
            : 'idle';

    if (state === 'idle' || state === lastRef.current) return;
    lastRef.current = state;

    const cue =
      state === 'success'
        ? SOUND_CUES.TX_CONFIRMED
        : state === 'error'
          ? SOUND_CUES.INPUT_INVALID
          : SOUND_CUES.TX_PENDING;

    window.dispatchEvent(
      new CustomEvent('plundrix:sound-cues', {
        detail: {
          gameId,
          label,
          cues: [cue],
          latestCue: { type: `tx.${state}`, sound: cue },
        },
      })
    );
  }, [gameId, label, isPending, isConfirming, isSuccess, error]);
}
