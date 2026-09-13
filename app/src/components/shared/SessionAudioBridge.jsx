import { useEffect, useRef } from 'react';
import audioManifest from '../../../audio/manifest.json' with { type: 'json' };
import { useAccessibility } from '../../context/AccessibilityContext';

const MAX_VOICES = 8;
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

function createMixer(audioContext) {
  const master = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();
  const sampleBus = audioContext.createGain();
  const synthBus = audioContext.createGain();
  compressor.threshold.value = -22;
  compressor.knee.value = 16;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.2;
  sampleBus.gain.value = 0.82;
  synthBus.gain.value = 0.42;
  sampleBus.connect(compressor);
  synthBus.connect(compressor);
  compressor.connect(master).connect(audioContext.destination);
  return { master, sampleBus, synthBus };
}

function registerVoice(activeVoices, source) {
  while (activeVoices.length >= MAX_VOICES) {
    const oldest = activeVoices.shift();
    try { oldest.stop(); } catch { /* already ended */ }
  }
  activeVoices.push(source);
  source.addEventListener('ended', () => {
    const index = activeVoices.indexOf(source);
    if (index >= 0) activeVoices.splice(index, 1);
  }, { once: true });
}

function playTone(audioContext, destination, voice, start, level, activeVoices) {
  const [frequency, delay, duration, type] = voice;
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
  registerVoice(activeVoices, oscillator);
  oscillator.start(voiceStart);
  oscillator.stop(voiceStart + duration + 0.02);
}

function playNoise(audioContext, destination, profile, start, activeVoices) {
  const [gainValue, frequency] = profile;
  const duration = 0.11;
  const frameCount = Math.ceil(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - (index / frameCount));
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.75;
  gain.gain.setValueAtTime(Math.max(0.0001, gainValue), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(destination);
  registerVoice(activeVoices, source);
  source.start(start);
  source.stop(start + duration);
}

function sampleUrl(cue, variant) {
  return `/audio/sfx/${cue.replaceAll('.', '-')}-${variant + 1}.mp3`;
}

async function loadSample(audioContext, cache, cue, variant) {
  const url = sampleUrl(cue, variant);
  if (!cache.has(url)) {
    cache.set(url, fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${url}`);
        return response.arrayBuffer();
      })
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .catch(() => null));
  }
  return cache.get(url);
}

function playSample(audioContext, destination, buffer, recipe, start, level, activeVoices, variation) {
  if (!buffer) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const panner = typeof audioContext.createStereoPanner === 'function' ? audioContext.createStereoPanner() : null;
  source.buffer = buffer;
  source.playbackRate.value = 1 + (variation - 1) * 0.004;
  gain.gain.value = Math.max(0.0001, recipe.sampleGain * level);
  if (panner) {
    panner.pan.value = recipe.pan || 0;
    source.connect(gain).connect(panner).connect(destination);
  } else source.connect(gain).connect(destination);
  registerVoice(activeVoices, source);
  source.start(Math.max(audioContext.currentTime, start));
}

function playCue({ audioContext, mixer, cache, activeVoices, cue, cueIndex, level, sequence, mode }) {
  const synth = CUE_PROFILE[cue];
  const recipe = audioManifest.cues[cue];
  const start = audioContext.currentTime + cueIndex * 0.055;
  if (mode !== 'sampled' && synth) {
    synth.tones.slice(0, mode === 'hybrid' ? 1 : 3).forEach((voice) => playTone(audioContext, mixer.synthBus, voice, start, 0.045, activeVoices));
    if (synth.noise && cueIndex === 0) playNoise(audioContext, mixer.synthBus, synth.noise, start, activeVoices);
  }
  if (mode !== 'procedural' && recipe) {
    const variant = Math.abs(sequence + [...cue].reduce((sum, character) => sum + character.charCodeAt(0), 0)) % audioManifest.target.pitchVariants.length;
    loadSample(audioContext, cache, cue, variant)
      .then((buffer) => playSample(audioContext, mixer.sampleBus, buffer, recipe, start, level, activeVoices, audioManifest.target.pitchVariants[variant]));
  }
}

function readAudioMode() {
  const mode = window.localStorage.getItem('plundrix-audio-test-mode');
  return ['hybrid', 'sampled', 'procedural'].includes(mode) ? mode : 'hybrid';
}

export default function SessionAudioBridge() {
  const { soundEnabled, masterVolume } = useAccessibility();
  const contextRef = useRef(null);
  const mixerRef = useRef(null);
  const buffersRef = useRef(new Map());
  const activeVoicesRef = useRef([]);
  const armedRef = useRef(false);
  const sequenceRef = useRef(0);
  const modeRef = useRef('hybrid');

  useEffect(() => {
    const arm = () => {
      if (!contextRef.current) {
        contextRef.current = createContext();
        if (contextRef.current) mixerRef.current = createMixer(contextRef.current);
      }
      if (contextRef.current?.state === 'suspended') contextRef.current.resume();
      modeRef.current = readAudioMode();
      armedRef.current = true;
      if (contextRef.current) Object.keys(audioManifest.cues).forEach((cue) => loadSample(contextRef.current, buffersRef.current, cue, 1));
    };
    const setMode = (event) => {
      if (['hybrid', 'sampled', 'procedural'].includes(event.detail?.mode)) modeRef.current = event.detail.mode;
    };

    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    window.addEventListener('plundrix:audio-mode', setMode);
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      window.removeEventListener('plundrix:audio-mode', setMode);
    };
  }, []);

  useEffect(() => {
    const onCues = (event) => {
      if (!armedRef.current || !soundEnabled || masterVolume <= 0 || !contextRef.current || !mixerRef.current) return;
      const cues = (event.detail?.cues || []).slice(-4);
      const level = masterVolume / 100;
      mixerRef.current.master.gain.setTargetAtTime(level, contextRef.current.currentTime, 0.015);
      sequenceRef.current += 1;
      cues.forEach((cue, index) => playCue({
        audioContext: contextRef.current,
        mixer: mixerRef.current,
        cache: buffersRef.current,
        activeVoices: activeVoicesRef.current,
        cue,
        cueIndex: index,
        level,
        sequence: sequenceRef.current,
        mode: event.detail?.audioMode || modeRef.current,
      }));
    };

    window.addEventListener('plundrix:sound-cues', onCues);
    return () => window.removeEventListener('plundrix:sound-cues', onCues);
  }, [masterVolume, soundEnabled]);

  return null;
}
