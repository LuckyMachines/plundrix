import { useEffect, useRef } from 'react';
import musicManifest from '../../../audio/music-manifest.json' with { type: 'json' };
import { useAccessibility } from '../../context/AccessibilityContext';

const tracks = musicManifest.tracks;

function trackUrl(index) {
  return `/audio/music/${tracks[index].outputFile}`;
}

export default function SessionMusicBridge() {
  const { musicEnabled, musicVolume } = useAccessibility();
  const audioRef = useRef(null);
  const armedRef = useRef(false);
  const trackIndexRef = useRef(0);
  const enabledRef = useRef(musicEnabled);
  const volumeRef = useRef(musicVolume);

  useEffect(() => {
    enabledRef.current = musicEnabled;
    volumeRef.current = musicVolume;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !musicEnabled;
    audio.volume = musicVolume / 100;
    if (!musicEnabled || musicVolume <= 0) audio.pause();
    else if (armedRef.current && audio.paused) audio.play().catch(() => {});
  }, [musicEnabled, musicVolume]);

  useEffect(() => {
    if (!tracks.length) return undefined;

    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'metadata';
    audio.setAttribute('data-audio-channel', 'music');
    audio.hidden = true;
    audio.volume = volumeRef.current / 100;
    audio.muted = !enabledRef.current;
    document.body.append(audio);

    const playCurrent = () => {
      audio.src = trackUrl(trackIndexRef.current);
      audio.load();
      if (enabledRef.current && volumeRef.current > 0) audio.play().catch(() => {});
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

    audio.addEventListener('ended', advance);
    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      audio.removeEventListener('ended', advance);
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
