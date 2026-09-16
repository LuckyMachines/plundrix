import { useEffect, useRef, useState } from 'react';

export default function MatchCommandMenu({ onIntel, onToggleAudio, soundEnabled, onShare, onExit }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.key === 'Escape' || !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const run = (action) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="match-command-menu">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="match-command-menu" className="match-command-menu__trigger">
        Commands <span aria-hidden="true">{open ? '-' : '+'}</span>
      </button>
      {open && (
        <div id="match-command-menu" className="match-command-menu__panel" role="menu" aria-label="Match commands">
          <button type="button" role="menuitem" onClick={() => run(onIntel)}>Table intel <span>Read the room</span></button>
          <button type="button" role="menuitem" onClick={() => run(onToggleAudio)}>{soundEnabled ? 'Mute sound' : 'Enable sound'} <span>Audio controls</span></button>
          <button type="button" role="menuitem" onClick={() => run(onShare)}>Share challenge <span>Copy the setup</span></button>
          <button type="button" role="menuitem" onClick={() => run(onExit)}>Exit match <span>Progress is saved</span></button>
        </div>
      )}
    </div>
  );
}
