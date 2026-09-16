import { useEffect, useRef } from 'react';
import musicManifest from '../../../audio/music-manifest.json' with { type: 'json' };
import { useAccessibility } from '../../context/AccessibilityContext';

const tracks = musicManifest.tracks;
const MUSIC_OUTPUT_SCALE = 1;

function trackUrl(index) {
  return `/audio/music/${tracks[index].outputFile}`;
}

function mixedVolume(preferenceVolume, duckDepth = 1) {
  return Math.min(1, Math.max(0, (preferenceVolume / 100) * MUSIC_OUTPUT_SCALE * duckDepth));
}

export default function SessionMusicBridge() {
  const { musicEnabled, musicVolume } = useAccessibility();
  const audioRef = useRef(null);
  const armedRef = useRef(false);
  const trackIndexRef = useRef(0);
  const enabledRef = useRef(musicEnabled);
  const volumeRef = useRef(musicVolume);
  const duckDepthRef = useRef(1);
  const duckTimerRef = useRef(null);

  useEffect(() => {
    enabledRef.current = musicEnabled;
    volumeRef.current = musicVolume;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !musicEnabled;
    audio.volume = mixedVolume(musicVolume, duckDepthRef.current);
    if (!musicEnabled || musicVolume <= 0) audio.pause();
    else if (armedRef.current && audio.paused && !document.hidden) audio.play().catch(() => {});
  }, [musicEnabled, musicVolume]);

  useEffect(() => {
    if (!tracks.length) return undefined;

    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'metadata';
    audio.setAttribute('data-audio-channel', 'music');
    audio.hidden = true;
    audio.volume = mixedVolume(volumeRef.current);
    audio.muted = !enabledRef.current;
    document.body.append(audio);

    const playCurrent = () => {
      audio.src = trackUrl(trackIndexRef.current);
      audio.load();
      if (enabledRef.current && volumeRef.current > 0 && !document.hidden) audio.play().catch(() => {});
    };
    const arm = () => {
      if (armedRef.current) return;
      armedRef.current = true;
      playCurrent();
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
    const advance = () => {
      trackIndexRef.current = (trackIndexRef.current + 1) % tracks.length;
      playCurrent();
    };
    const duck = (event) => {
      const depth = Math.min(1, Math.max(0.2, Number(event.detail?.depth) || 0.42));
      const duration = Math.min(1600, Math.max(200, Number(event.detail?.duration) || 520));
      duckDepthRef.current = depth;
      audio.volume = mixedVolume(volumeRef.current, depth);
      window.clearTimeout(duckTimerRef.current);
      duckTimerRef.current = window.setTimeout(() => {
        duckDepthRef.current = 1;
        audio.volume = mixedVolume(volumeRef.current);
      }, duration);
    };
    const handleVisibility = () => {
      if (document.hidden) audio.pause();
      else if (armedRef.current && enabledRef.current && volumeRef.current > 0) audio.play().catch(() => {});
    };

    audio.addEventListener('ended', advance);
    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    window.addEventListener('plundrix:music-duck', duck);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      window.removeEventListener('plundrix:music-duck', duck);
      document.removeEventListener('visibilitychange', handleVisibility);
      audio.removeEventListener('ended', advance);
      window.clearTimeout(duckTimerRef.current);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.remove();
      audioRef.current = null;
      armedRef.current = false;
    };
  }, []);

  return null;
}
