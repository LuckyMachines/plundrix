import { useEffect, useState } from 'react';

const CEREMONY_COPY = {
  opening: { eyebrow: 'Nightfall protocol', title: 'The table is live', detail: 'Four operators. Concealed moves. Five locks between you and the prize.' },
  victory: { eyebrow: 'Vault breach', title: 'You took the night', detail: 'The lock gave way, the ledger held, and every rival saw it happen.' },
  defeat: { eyebrow: 'Rival breach', title: 'The prize changed hands', detail: 'The vault remembers the route. Use the evidence and steal back the next run.' },
  reward: { eyebrow: 'Contraband cache', title: 'Something useful survived', detail: 'Choose one illicit advantage. It follows you into the next vault.' },
};

export default function OperationCeremony({ event }) {
  const [visible, setVisible] = useState(false);
  const copy = event ? CEREMONY_COPY[event.type] : null;

  useEffect(() => {
    if (!event || !copy) return undefined;
    setVisible(false);
    const open = window.setTimeout(() => setVisible(true), event.delayMs || 0);
    const close = window.setTimeout(() => setVisible(false), (event.delayMs || 0) + (event.durationMs || 1900));
    return () => { window.clearTimeout(open); window.clearTimeout(close); };
  }, [event?.key, copy]);

  if (!copy) return null;
  return (
    <div className="operation-ceremony" data-kind={event.type} data-visible={visible} aria-hidden={!visible}>
      <div className="operation-ceremony__doors"><i /><i /></div>
      <div className="operation-ceremony__crest" aria-hidden="true"><i /><i /><span>PX</span></div>
      <div className="operation-ceremony__copy" role={visible ? 'status' : undefined} aria-live="polite">
        <p>{copy.eyebrow}</p>
        <strong>{event.title || copy.title}</strong>
        <small>{copy.detail}</small>
      </div>
      <div className="operation-ceremony__locks" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
    </div>
  );
}
