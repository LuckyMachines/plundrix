import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  PREFERENCE_BY_ID,
  PREFERENCE_STORAGE_KEY,
  importPreferenceBundle,
  loadPreferences,
  normalizePreferences,
  preferenceDefaults,
  savePreferences,
} from '../data/preferences';

const PreferencesContext = createContext(null);

function environmentPreferences() {
  return {
    prefersReducedMotion: typeof window !== 'undefined'
      && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
  };
}

function initialState() {
  if (typeof window === 'undefined') {
    return { preferences: preferenceDefaults(), storageStatus: 'ready' };
  }
  const result = loadPreferences(window.localStorage, environmentPreferences());
  return { preferences: result.values, storageStatus: result.status };
}

export function AccessibilityProvider({ children }) {
  const [initial] = useState(initialState);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [storageStatus, setStorageStatus] = useState(initial.storageStatus);
  const [notificationPermission, setNotificationPermission] = useState(() => (
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  ));

  const setPreference = useCallback((id, value) => {
    const definition = PREFERENCE_BY_ID[id];
    if (!definition) throw new Error(`Unknown preference: ${id}`);
    setPreferences((current) => normalizePreferences({ ...current, [id]: value }, environmentPreferences()));
    setStorageStatus('ready');
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(preferenceDefaults(environmentPreferences()));
    setStorageStatus('reset');
  }, []);

  const importPreferences = useCallback((source) => {
    const next = importPreferenceBundle(source, environmentPreferences());
    setPreferences(next);
    setStorageStatus('imported');
    return next;
  }, []);

  const setBackgroundTurnAlerts = useCallback(async (next) => {
    if (!next) {
      setPreference('backgroundTurnAlerts', false);
      return 'disabled';
    }
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }
    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    setPreference('backgroundTurnAlerts', permission === 'granted');
    return permission;
  }, [setPreference]);

  useEffect(() => {
    const saved = savePreferences(window.localStorage, preferences);
    if (!saved.ok) setStorageStatus('unavailable');
  }, [preferences]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('readable-ui', preferences.readabilityMode);
    root.classList.toggle('reduced-motion-ui', preferences.reducedMotion);
    root.classList.toggle('high-contrast-ui', preferences.highContrast);
    root.classList.toggle('compact-ui', preferences.interfaceDensity === 'compact');
    root.classList.toggle('keyboard-hints-ui', preferences.keyboardHints);
    root.dataset.preferenceSchema = '2';
  }, [preferences]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== PREFERENCE_STORAGE_KEY) return;
      const result = loadPreferences(window.localStorage, environmentPreferences());
      setPreferences(result.values);
      setStorageStatus('synced');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const legacySetters = useMemo(() => ({
    setReadabilityMode: (value) => setPreference('readabilityMode', value),
    setReducedMotion: (value) => setPreference('reducedMotion', value),
    setSoundEnabled: (value) => setPreference('soundEnabled', value),
  }), [setPreference]);

  const value = useMemo(() => ({
    ...preferences,
    preferences,
    storageStatus,
    notificationPermission,
    setPreference,
    setBackgroundTurnAlerts,
    resetPreferences,
    importPreferences,
    ...legacySetters,
  }), [
    importPreferences,
    legacySetters,
    notificationPermission,
    preferences,
    resetPreferences,
    setBackgroundTurnAlerts,
    setPreference,
    storageStatus,
  ]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const PreferencesProvider = AccessibilityProvider;

export function useAccessibility() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}

export const usePreferences = useAccessibility;
