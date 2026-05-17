export default function AliveActionCard({
  action,
  active = false,
  pressed = false,
  disabled = false,
  stunned = false,
  invalidCount = 0,
  danger = false,
  children,
  onIntentStart,
  onIntentEnd,
  onInvalidIntent,
}) {
  const handleIntentStart = () => {
    if (disabled) {
      onInvalidIntent?.(action);
      return;
    }
    onIntentStart?.(action);
  };

  const handleIntentEnd = () => {
    onIntentEnd?.(action);
  };

  return (
    <div
      className={`
        alive-action-card flex flex-col items-center border rounded p-4
        transition-all duration-300
        ${disabled ? 'border-vault-border bg-vault-dark/30 opacity-60' : danger ? 'border-signal-red/20 bg-vault-panel' : 'border-vault-border bg-vault-panel'}
        ${active ? 'alive-action-card-active' : ''}
        ${pressed ? 'alive-action-card-pressed' : ''}
        ${stunned ? 'alive-action-card-stunned' : ''}
      `}
      data-action={action}
      data-invalid={invalidCount}
      onMouseEnter={handleIntentStart}
      onMouseLeave={handleIntentEnd}
      onFocusCapture={handleIntentStart}
      onBlurCapture={handleIntentEnd}
      onPointerDown={handleIntentStart}
      onPointerUp={handleIntentEnd}
      onPointerCancel={handleIntentEnd}
    >
      {children}
    </div>
  );
}
