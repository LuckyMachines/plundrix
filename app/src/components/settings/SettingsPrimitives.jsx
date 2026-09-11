import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SettingsDialog({ isOpen, onClose, labelledBy, children }) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      .filter((element) => !element.closest('[hidden]'));
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    returnFocusRef.current = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => dialogRef.current?.querySelector(FOCUSABLE)?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = priorOverflow;
      document.removeEventListener('keydown', onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen, onKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="settings-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}

export function SettingsMenu({ groups, activeId, onSelect }) {
  return (
    <nav className="settings-menu" aria-label="Settings categories">
      {groups.map((group, index) => (
        <button
          key={group.id}
          type="button"
          className="settings-menu__item"
          data-active={activeId === group.id}
          aria-current={activeId === group.id ? 'true' : undefined}
          onClick={() => onSelect(group.id)}
        >
          <span className="settings-menu__index">0{index + 1}</span>
          <span>
            <small>{group.eyebrow}</small>
            <strong>{group.label}</strong>
          </span>
        </button>
      ))}
    </nav>
  );
}

export function PreferenceSwitch({ id, label, checked, disabled = false, onChange }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      className="preference-switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      data-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="preference-switch__track" aria-hidden="true">
        <span className="preference-switch__thumb" />
      </span>
      <span className="preference-switch__state">{checked ? 'On' : 'Off'}</span>
    </button>
  );
}

export function PreferenceSlider({ id, label, value, min, max, step, suffix = '', disabled = false, onChange }) {
  return (
    <div className="preference-slider">
      <output htmlFor={id} aria-label={`${label}: ${value}${suffix}`}>{value}{suffix}</output>
      <input
        id={id}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function PreferenceSelect({ id, label, value, options, disabled = false, onChange }) {
  return (
    <label className="preference-select" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span aria-hidden="true">&#9662;</span>
    </label>
  );
}

export function Shortcut({ keys, label, compact = false }) {
  return (
    <span className={`settings-shortcut${compact ? ' settings-shortcut--compact' : ''}`} aria-label={`${label}: ${keys.join(' plus ')}`}>
      <span>{label}</span>
      <span aria-hidden="true">{keys.map((key) => <kbd key={key}>{key}</kbd>)}</span>
    </span>
  );
}
