import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AccessibilityContext = createContext(null);

const READABILITY_KEY = 'plundrix_readability_mode';
const REDUCED_MOTION_KEY = 'plundrix_reduced_motion';

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

  useEffect(() => {
    window.localStorage.setItem(READABILITY_KEY, String(readabilityMode));
    document.documentElement.classList.toggle('readable-ui', readabilityMode);
  }, [readabilityMode]);

  useEffect(() => {
    window.localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion));
    document.documentElement.classList.toggle('reduced-motion-ui', reducedMotion);
  }, [reducedMotion]);

  const value = useMemo(
    () => ({
      readabilityMode,
      reducedMotion,
      setReadabilityMode,
      setReducedMotion,
    }),
    [readabilityMode, reducedMotion]
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
