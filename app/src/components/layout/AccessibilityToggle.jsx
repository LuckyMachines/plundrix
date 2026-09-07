import { useAccessibility } from '../../context/AccessibilityContext';

export default function AccessibilityToggle() {
  const {
    readabilityMode,
    reducedMotion,
    soundEnabled,
    setReadabilityMode,
    setReducedMotion,
    setSoundEnabled,
  } = useAccessibility();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setReadabilityMode(!readabilityMode)}
        className={`px-3 py-2 min-h-[44px] rounded border font-mono text-xs uppercase tracking-wider transition-colors ${
          readabilityMode
            ? 'border-blueprint/50 text-blueprint bg-blueprint/10'
            : 'border-vault-border text-vault-text-dim hover:text-vault-text'
        }`}
        aria-pressed={readabilityMode}
      >
        Readable
      </button>
      <button
        type="button"
        onClick={() => setReducedMotion(!reducedMotion)}
        className={`px-3 py-2 min-h-[44px] rounded border font-mono text-xs uppercase tracking-wider transition-colors ${
          reducedMotion
            ? 'border-blueprint/50 text-blueprint bg-blueprint/10'
            : 'border-vault-border text-vault-text-dim hover:text-vault-text'
        }`}
        aria-pressed={reducedMotion}
      >
        Low Motion
      </button>
      <button
        type="button"
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`px-3 py-2 min-h-[44px] rounded border font-mono text-xs uppercase tracking-wider transition-colors ${
          soundEnabled
            ? 'border-oxide-green/50 text-oxide-green bg-oxide-green/10'
            : 'border-vault-border text-vault-text-dim hover:text-vault-text'
        }`}
        aria-pressed={soundEnabled}
      >
        Sound {soundEnabled ? 'On' : 'Off'}
      </button>
    </div>
  );
}
