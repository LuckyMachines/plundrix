import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AccessibilityContext = createContext(null);

const READABILITY_KEY = 'plundrix_readability_mode';
const REDUCED_MOTION_KEY = 'plundrix_reduced_motion';
const SOUND_KEY = 'plundrix_sound_enabled';

function readBoolean(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

export function AccessibilityProvider({ children }) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [readabilityMode, setReadabilityMode] = useState(() =>
    readBoolean(READABILITY_KEY, false)
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    readBoolean(REDUCED_MOTION_KEY, prefersReducedMotion)
  );
  const [soundEnabled, setSoundEnabled] = useState(() =>
    readBoolean(SOUND_KEY, true)
  );

  useEffect(() => {
    window.localStorage.setItem(READABILITY_KEY, String(readabilityMode));
    document.documentElement.classList.toggle('readable-ui', readabilityMode);
  }, [readabilityMode]);

  useEffect(() => {
    window.localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion));
    document.documentElement.classList.toggle('reduced-motion-ui', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    window.localStorage.setItem(SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const value = useMemo(
    () => ({
      readabilityMode,
      reducedMotion,
      soundEnabled,
      setReadabilityMode,
      setReducedMotion,
      setSoundEnabled,
    }),
    [readabilityMode, reducedMotion, soundEnabled]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}
