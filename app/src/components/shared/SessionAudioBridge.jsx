import { useEffect, useRef } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const CUE_PROFILE = Object.freeze({
  'intent.pick': { tones: [[196, 0.00, 0.11, 'triangle'], [392, 0.055, 0.08, 'sine']], noise: [0.025, 1700] },
  'intent.search': { tones: [[280, 0.00, 0.18, 'sine'], [420, 0.07, 0.16, 'sine']], noise: [0.018, 3200] },
  'intent.sabotage': { tones: [[126, 0.00, 0.20, 'sawtooth'], [82, 0.07, 0.24, 'square']], noise: [0.035, 850] },
  'input.invalid': { tones: [[92, 0.00, 0.12, 'square']] },
  'action.commit': { tones: [[245, 0.00, 0.08, 'triangle'], [122, 0.08, 0.13, 'sine']], noise: [0.022, 1200] },
  'round.seal': { tones: [[160, 0.00, 0.22, 'triangle']], noise: [0.035, 700] },
  'round.reveal': { tones: [[220, 0.00, 0.26, 'sine'], [330, 0.12, 0.28, 'triangle']], noise: [0.024, 2800] },
  'round.impact': { tones: [[98, 0.00, 0.24, 'sine']], noise: [0.05, 540] },
  'tx.pending': { tones: [[180, 0.00, 0.14, 'triangle']] },
  'tx.confirmed': { tones: [[440, 0.00, 0.16, 'triangle'], [660, 0.08, 0.12, 'sine']] },
  'lock.crack': { tones: [[520, 0.00, 0.12, 'triangle'], [780, 0.05, 0.18, 'sine']], noise: [0.04, 2100] },
  'lock.resist': { tones: [[150, 0.00, 0.25, 'square'], [112, 0.08, 0.18, 'triangle']], noise: [0.028, 600] },
  'tool.found': { tones: [[390, 0.00, 0.16, 'sine'], [585, 0.08, 0.20, 'triangle']], noise: [0.018, 3500] },
  'signal.lost': { tones: [[310, 0.00, 0.18, 'sine'], [205, 0.08, 0.24, 'triangle']], noise: [0.018, 1400] },
  'sabotage.hit': { tones: [[118, 0.00, 0.20, 'sawtooth'], [72, 0.09, 0.30, 'square']], noise: [0.055, 720] },
  'sabotage.blocked': { tones: [[105, 0.00, 0.12, 'square'], [210, 0.09, 0.08, 'triangle']], noise: [0.028, 1250] },
  'gadget.signature': { tones: [[330, 0.00, 0.12, 'square'], [495, 0.07, 0.18, 'triangle']], noise: [0.025, 2600] },
  'stun.clear': { tones: [[300, 0.00, 0.13, 'triangle']] },
  'round.ready': { tones: [[360, 0.00, 0.14, 'triangle'], [540, 0.08, 0.13, 'sine']] },
  'round.resolve': { tones: [[280, 0.00, 0.20, 'triangle']], noise: [0.02, 1800] },
  'game.win': { tones: [[220, 0.00, 0.20, 'triangle'], [330, 0.11, 0.20, 'triangle'], [440, 0.22, 0.25, 'sine'], [660, 0.34, 0.38, 'sine']], noise: [0.025, 3000] },
});

function createContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}

function playTone(audioContext, destination, [frequency, delay, duration, type], start, level) {
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const voiceStart = start + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, voiceStart);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(55, frequency * 0.72), voiceStart + duration);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.max(700, frequency * 6), voiceStart);
  gain.gain.setValueAtTime(0.0001, voiceStart);
  gain.gain.exponentialRampToValueAtTime(level, voiceStart + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, voiceStart + duration);
  oscillator.connect(filter).connect(gain).connect(destination);
  oscillator.start(voiceStart);
  oscillator.stop(voiceStart + duration + 0.02);
}

function playNoise(audioContext, destination, [gainValue, frequency], start, volume) {
  const duration = 0.11;
  const frameCount = Math.ceil(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - (index / frameCount));
  }
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.75;
  gain.gain.setValueAtTime(Math.max(0.0001, gainValue * volume), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(destination);
  source.start(start);
  source.stop(start + duration);
}

function playCue(audioContext, cue, cueIndex, volume) {
  const profile = CUE_PROFILE[cue];
  if (!audioContext || !profile) return;
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 18;
  compressor.ratio.value = 7;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.18;
  compressor.connect(audioContext.destination);
  const level = Math.max(0.0002, 0.048 * (volume / 100));
  const start = audioContext.currentTime + cueIndex * 0.055;
  profile.tones.slice(0, 4).forEach((voice) => playTone(audioContext, compressor, voice, start, level));
  if (profile.noise) playNoise(audioContext, compressor, profile.noise, start, volume / 100);
}

export default function SessionAudioBridge() {
  const { soundEnabled, masterVolume } = useAccessibility();
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
      if (!armedRef.current || !soundEnabled || masterVolume <= 0) return;
      if (!contextRef.current) contextRef.current = createContext();
      const cues = event.detail?.cues || [];
      cues.slice(-4).forEach((cue, index) => playCue(contextRef.current, cue, index, masterVolume));
    };

    window.addEventListener('plundrix:sound-cues', onCues);
    return () => window.removeEventListener('plundrix:sound-cues', onCues);
  }, [masterVolume, soundEnabled]);

  return null;
}
