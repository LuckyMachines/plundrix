import { useMemo, useRef, useState } from 'react';
import { PREFERENCE_DEFINITIONS, PREFERENCE_GROUPS, exportPreferenceBundle } from '../../data/preferences';
import { usePreferences } from '../../context/AccessibilityContext';
import { copyText } from '../../lib/clipboard';
import { useToast } from '../../context/ToastContext';
import {
  PreferenceSelect,
  PreferenceSlider,
  PreferenceSwitch,
  SettingsDialog,
  SettingsMenu,
  Shortcut,
} from './SettingsPrimitives';

function capabilityState(definition, preferences) {
  if (definition.capability !== 'notifications') return { disabled: false, note: '' };
  if (preferences.notificationPermission === 'unsupported') {
    return { disabled: true, note: 'Browser notifications are unavailable here.' };
  }
  if (preferences.notificationPermission === 'denied') {
    return { disabled: true, note: 'Blocked by your browser. Change the site permission to enable alerts.' };
  }
  return { disabled: false, note: 'Your browser will ask once before alerts can be enabled.' };
}

function PreferenceControl({ definition, preferences, onChange }) {
  const capability = capabilityState(definition, preferences);
  const value = preferences[definition.id];
  if (definition.type === 'range') {
    return <PreferenceSlider {...definition} value={value} disabled={!preferences.soundEnabled} onChange={onChange} />;
  }
  if (definition.type === 'select') {
    return <PreferenceSelect {...definition} value={value} onChange={onChange} />;
  }
  return <PreferenceSwitch id={`preference-${definition.id}`} label={definition.label} checked={value} disabled={capability.disabled} onChange={onChange} />;
}

function PreferenceRow({ definition, preferences, onChange }) {
  const capability = capabilityState(definition, preferences);
  return (
    <article className="preference-row" data-preference={definition.id}>
      <div className="preference-row__copy">
        <h3>{definition.label}</h3>
        <p>{definition.description}</p>
        {capability.note && <p className="preference-row__note">{capability.note}</p>}
      </div>
      <PreferenceControl definition={definition} preferences={preferences} onChange={onChange} />
    </article>
  );
}

export default function SettingsDrawer({ isOpen, onClose }) {
  const preferences = usePreferences();
  const toast = useToast();
  const [activeGroup, setActiveGroup] = useState(PREFERENCE_GROUPS[0].id);
  const [query, setQuery] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const importRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const currentGroup = PREFERENCE_GROUPS.find((group) => group.id === activeGroup) || PREFERENCE_GROUPS[0];
  const visibleDefinitions = useMemo(() => PREFERENCE_DEFINITIONS.filter((definition) => {
    if (!normalizedQuery) return definition.group === activeGroup;
    return [definition.label, definition.description, ...(definition.searchTerms || [])]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  }), [activeGroup, normalizedQuery]);

  const changePreference = async (definition, next) => {
    if (definition.id === 'backgroundTurnAlerts') {
      const result = await preferences.setBackgroundTurnAlerts(next);
      if (next && result !== 'granted') toast.warning('Browser permission prevented turn alerts.', { title: 'Alerts unchanged' });
      return;
    }
    preferences.setPreference(definition.id, next);
    if (definition.id === 'soundEnabled' && next) {
      window.dispatchEvent(new CustomEvent('plundrix:sound-cues', { detail: { cues: ['tx.confirmed'] } }));
    }
  };

  const copyPreferences = async () => {
    try {
      await copyText(exportPreferenceBundle(preferences.preferences));
      toast.success('Preference JSON copied to the clipboard.', { title: 'Setup exported' });
    } catch {
      toast.error('The browser could not copy your preference export.', { title: 'Export failed' });
    }
  };

  const importFile = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) return;
    try {
      preferences.importPreferences(await file.text());
      toast.success('Display, feedback, gameplay, and privacy preferences were restored.', { title: 'Setup imported' });
    } catch (error) {
      toast.error(error.message, { title: 'Import failed' });
    }
  };

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    preferences.resetPreferences();
    setConfirmReset(false);
    toast.info('Plundrix settings now use device-aware defaults.', { title: 'Defaults restored' });
  };

  const statusCopy = {
    recovered: 'A damaged preference record was safely replaced with defaults.',
    migrated: 'Your earlier accessibility settings were migrated into this control center.',
    unavailable: 'This browser is blocking preference storage; changes last for this tab.',
    imported: 'Imported setup saved on this device.',
    reset: 'Device-aware defaults restored.',
    synced: 'Preferences synchronized from another tab.',
    ready: 'Changes save automatically on this device.',
  }[preferences.storageStatus] || 'Changes save automatically on this device.';

  return (
    <SettingsDialog isOpen={isOpen} onClose={onClose} labelledBy="settings-title">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">Operator control center / device local</p>
          <h2 id="settings-title">Game settings</h2>
          <p>{statusCopy}</p>
        </div>
        <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">
          <span aria-hidden="true">&#215;</span>
        </button>
      </header>

      <div className="settings-search">
        <label htmlFor="settings-search">Find a setting</label>
        <div>
          <span aria-hidden="true">/</span>
          <input
            id="settings-search"
            type="search"
            value={query}
            placeholder="Try sound, motion, alerts..."
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && <button type="button" onClick={() => setQuery('')}>Clear</button>}
        </div>
      </div>

      <div className="settings-layout">
        <SettingsMenu groups={PREFERENCE_GROUPS} activeId={activeGroup} onSelect={(id) => { setActiveGroup(id); setQuery(''); }} />
        <main className="settings-panel">
          <div className="settings-panel__heading">
            <p>{normalizedQuery ? 'Search results' : currentGroup.eyebrow}</p>
            <h2>{normalizedQuery ? `Matching "${query.trim()}"` : currentGroup.label}</h2>
            <span>{normalizedQuery ? `${visibleDefinitions.length} found` : currentGroup.description}</span>
          </div>
          <div className="preference-list">
            {visibleDefinitions.map((definition) => (
              <PreferenceRow
                key={definition.id}
                definition={definition}
                preferences={preferences}
                onChange={(next) => changePreference(definition, next)}
              />
            ))}
            {!visibleDefinitions.length && (
              <div className="settings-empty" role="status">
                <strong>No matching control.</strong>
                <span>Try sound, motion, text, alerts, or privacy.</span>
              </div>
            )}
          </div>
          {activeGroup === 'feedback' && !normalizedQuery && (
            <button
              type="button"
              className="settings-test-cue"
              disabled={!preferences.soundEnabled || preferences.masterVolume === 0}
              onClick={() => window.dispatchEvent(new CustomEvent('plundrix:sound-cues', { detail: { cues: ['lock.crack', 'tool.found'] } }))}
            >
              Test current sound
            </button>
          )}
        </main>
      </div>

      <footer className="settings-footer">
        <div className="settings-footer__actions">
          <button type="button" onClick={copyPreferences}>Copy setup</button>
          <button type="button" onClick={() => importRef.current?.click()}>Import setup</button>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={importFile} hidden />
          <button type="button" className={confirmReset ? 'is-confirming' : ''} onClick={reset} onBlur={() => setConfirmReset(false)}>
            {confirmReset ? 'Confirm reset' : 'Restore defaults'}
          </button>
        </div>
        {preferences.keyboardHints && (
          <div className="settings-footer__shortcuts">
            <Shortcut keys={['Ctrl', '.']} label="Open settings" />
            <Shortcut keys={['Esc']} label="Close" />
          </div>
        )}
      </footer>
    </SettingsDialog>
  );
}
