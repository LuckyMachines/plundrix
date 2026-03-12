import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

let nextId = 0;

const ICONS = {
  success: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 7 12 13 4" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 L14.5 13 L1.5 13 Z" />
      <line x1="8" y1="6" x2="8" y2="9" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <line x1="8" y1="7" x2="8" y2="11" />
      <circle cx="8" cy="5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const STYLES = {
  success: {
    border: 'border-oxide-green/40',
    bg: 'bg-oxide-green/8',
    glow: 'shadow-[0_0_20px_rgba(64,160,128,0.12)]',
    icon: 'text-oxide-green',
    title: 'text-oxide-green',
    body: 'text-vault-text',
    progress: 'bg-oxide-green/40',
  },
  error: {
    border: 'border-signal-red/40',
    bg: 'bg-signal-red/8',
    glow: 'shadow-[0_0_20px_rgba(212,64,64,0.12)]',
    icon: 'text-signal-red',
    title: 'text-signal-red',
    body: 'text-vault-text',
    progress: 'bg-signal-red/40',
  },
  warning: {
    border: 'border-tungsten/40',
    bg: 'bg-tungsten/8',
    glow: 'shadow-[0_0_20px_rgba(196,149,106,0.12)]',
    icon: 'text-tungsten',
    title: 'text-tungsten',
    body: 'text-vault-text',
    progress: 'bg-tungsten/40',
  },
  info: {
    border: 'border-blueprint/40',
    bg: 'bg-blueprint/8',
    glow: 'shadow-[0_0_20px_rgba(58,124,196,0.12)]',
    icon: 'text-blueprint',
    title: 'text-blueprint',
    body: 'text-vault-text',
    progress: 'bg-blueprint/40',
  },
};

const DEFAULT_DURATION = {
  success: 4000,
  error: 8000,
  warning: 6000,
  info: 5000,
};

function Toast({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.info;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  }, [onDismiss, toast.id]);

  const startTimer = useCallback(() => {
    if (toast.duration === Infinity) return;
    clearTimeout(timerRef.current);
    startRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainingRef.current);
  }, [dismiss, toast.duration]);

  const pauseTimer = useCallback(() => {
    if (toast.duration === Infinity) return;
    clearTimeout(timerRef.current);
    remainingRef.current -= Date.now() - startRef.current;
    if (remainingRef.current < 0) remainingRef.current = 0;
  }, [toast.duration]);

  // Start timer on mount
  useState(() => {
    startTimer();
  });

  return (
    <div
      role="alert"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={[
        'relative overflow-hidden rounded-lg border backdrop-blur-md',
        'w-[360px] max-w-[calc(100vw-2rem)]',
        s.border, s.bg, s.glow,
        'bg-vault-surface/95',
        exiting
          ? 'animate-[toast-out_280ms_ease-in_forwards]'
          : 'animate-[toast-in_320ms_ease-out]',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`mt-0.5 ${s.icon}`}>
          {ICONS[toast.type]}
        </span>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`font-mono text-xs font-semibold uppercase tracking-[0.18em] ${s.title}`}>
              {toast.title}
            </p>
          )}
          <p className={`font-mono text-xs leading-relaxed ${s.body} ${toast.title ? 'mt-1' : ''} break-words`}>
            {toast.message}
          </p>
          {toast.action && (
            <button
              onClick={() => { toast.action.onClick(); dismiss(); }}
              className={`mt-2 font-mono text-[10px] uppercase tracking-[0.2em] ${s.icon} hover:brightness-125 transition-all`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="mt-0.5 text-vault-text-dim hover:text-vault-text transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>
      {toast.duration !== Infinity && (
        <div className="h-[2px] w-full bg-vault-border/30">
          <div
            className={`h-full ${s.progress}`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
              animationPlayState: 'running',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type, message, options = {}) => {
    const id = ++nextId;
    const duration = options.duration ?? DEFAULT_DURATION[type] ?? 5000;
    setToasts((prev) => [
      ...prev.slice(-4), // keep max 5
      { id, type, message, title: options.title, action: options.action, duration },
    ]);
    return id;
  }, []);

  const api = {
    success: (msg, opts) => toast('success', msg, opts),
    error: (msg, opts) => toast('error', msg, opts),
    warning: (msg, opts) => toast('warning', msg, opts),
    info: (msg, opts) => toast('info', msg, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Notifications"
          className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-3 pointer-events-none"
        >
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
