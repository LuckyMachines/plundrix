import { useEffect, useRef } from 'react';

const CUE_PROFILE = {
  'intent.pick': [220, 0.035],
  'intent.search': [330, 0.03],
  'intent.sabotage': [150, 0.04],
  'input.invalid': [90, 0.05],
  'action.commit': [260, 0.05],
  'tx.pending': [180, 0.035],
  'tx.confirmed': [440, 0.055],
  'lock.crack': [520, 0.07],
  'tool.found': [390, 0.06],
  'sabotage.hit': [120, 0.07],
  'stun.clear': [300, 0.04],
  'round.ready': [360, 0.06],
  'round.resolve': [280, 0.08],
  'game.win': [620, 0.11],
};

function createContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}

function playCue(audioContext, cue, index) {
  const profile = CUE_PROFILE[cue];
  if (!audioContext || !profile) return;

  const [frequency, duration] = profile;
  const start = audioContext.currentTime + index * 0.045;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = cue.includes('sabotage') || cue.includes('invalid') ? 'sawtooth' : 'triangle';
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, frequency * 0.72), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.035, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

export default function SessionAudioBridge() {
  const contextRef = useRef(null);
  const armedRef = useRef(false);

  useEffect(() => {
    const arm = () => {
      if (!contextRef.current) contextRef.current = createContext();
      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume();
      }
      armedRef.current = true;
    };

    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, []);

  useEffect(() => {
    const onCues = (event) => {
      if (!armedRef.current) return;
      if (!contextRef.current) contextRef.current = createContext();
      const cues = event.detail?.cues || [];
      cues.slice(-3).forEach((cue, index) => playCue(contextRef.current, cue, index));
    };

    window.addEventListener('plundrix:sound-cues', onCues);
    return () => window.removeEventListener('plundrix:sound-cues', onCues);
  }, []);

  return null;
}
