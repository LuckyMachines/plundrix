import { useEffect, useRef } from 'react';
import audioManifest from '../../../audio/manifest.json' with { type: 'json' };
import { useAccessibility } from '../../context/AccessibilityContext';

const MAX_VOICES = 4;
const MAX_CUES_PER_EVENT = 2;
const REPEAT_COOLDOWN_MS = 180;
const CUE_PRIORITY = Object.freeze({
  'game.win': 100,
  'lock.crack': 90,
  'tool.found': 85,
  'sabotage.hit': 82,
  'sabotage.blocked': 80,
  'lock.resist': 78,
  'gadget.signature': 75,
  'round.impact': 70,
  'signal.lost': 68,
  'tx.confirmed': 64,
  'input.invalid': 62,
  'round.reveal': 58,
  'round.seal': 56,
  'round.resolve': 54,
  'round.ready': 50,
  'action.commit': 45,
  'intent.pick': 30,
  'intent.search': 30,
  'intent.sabotage': 30,
  'tx.pending': 20,
  'stun.clear': 20,
});

function createContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}

function createMixer(audioContext) {
  const master = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();
  const sampleBus = audioContext.createGain();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.14;
  sampleBus.gain.value = 0.72;
  sampleBus.connect(compressor);
  compressor.connect(master).connect(audioContext.destination);
  return { master, sampleBus };
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

function playSample(audioContext, destination, buffer, recipe, start, level, activeVoices) {
  if (!buffer) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, recipe.sampleGain * level), start + 0.006);
  source.connect(gain).connect(destination);
  registerVoice(activeVoices, source);
  source.start(start);
}

function selectCues(rawCues, lastPlayedAt, now) {
  return [...new Set(rawCues.slice(-4))]
    .filter((cue) => audioManifest.cues[cue])
    .filter((cue) => now - (lastPlayedAt.get(cue) || 0) >= REPEAT_COOLDOWN_MS)
    .sort((left, right) => (CUE_PRIORITY[right] || 0) - (CUE_PRIORITY[left] || 0))
    .slice(0, MAX_CUES_PER_EVENT);
}

export default function SessionAudioBridge() {
  const { soundEnabled, soundVolume } = useAccessibility();
  const contextRef = useRef(null);
  const mixerRef = useRef(null);
  const buffersRef = useRef(new Map());
  const activeVoicesRef = useRef([]);
  const armedRef = useRef(false);
  const sequenceRef = useRef(0);
  const lastPlayedAtRef = useRef(new Map());

  useEffect(() => {
    const arm = () => {
      if (!contextRef.current) {
        contextRef.current = createContext();
        if (contextRef.current) mixerRef.current = createMixer(contextRef.current);
      }
      if (contextRef.current?.state === 'suspended') contextRef.current.resume();
      armedRef.current = true;
      if (contextRef.current) Object.keys(audioManifest.cues).forEach((cue) => loadSample(contextRef.current, buffersRef.current, cue, 1));
    };

    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      activeVoicesRef.current.splice(0).forEach((source) => {
        try { source.stop(); } catch { /* already ended */ }
      });
      contextRef.current?.close().catch(() => {});
      contextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onCues = (event) => {
      if (!armedRef.current || !soundEnabled || soundVolume <= 0 || !contextRef.current || !mixerRef.current) return;
      const now = performance.now();
      const cues = selectCues(event.detail?.cues || [], lastPlayedAtRef.current, now);
      if (!cues.length) return;

      const audioContext = contextRef.current;
      const level = soundVolume / 100;
      mixerRef.current.master.gain.setTargetAtTime(level, audioContext.currentTime, 0.012);
      sequenceRef.current += 1;
      cues.forEach((cue, index) => {
        lastPlayedAtRef.current.set(cue, now);
        const variant = Math.abs(sequenceRef.current + [...cue].reduce((sum, character) => sum + character.charCodeAt(0), 0)) % audioManifest.target.pitchVariants.length;
        const start = audioContext.currentTime + index * 0.075;
        loadSample(audioContext, buffersRef.current, cue, variant)
          .then((buffer) => playSample(audioContext, mixerRef.current.sampleBus, buffer, audioManifest.cues[cue], start, level, activeVoicesRef.current));
      });
      window.dispatchEvent(new CustomEvent('plundrix:music-duck', { detail: { duration: 520, depth: 0.42 } }));
    };

    window.addEventListener('plundrix:sound-cues', onCues);
    return () => window.removeEventListener('plundrix:sound-cues', onCues);
  }, [soundEnabled, soundVolume]);

  return null;
}
