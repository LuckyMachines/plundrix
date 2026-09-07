import { useEffect, useRef, useState } from 'react';
import { GADGET_CHASSIS_BY_ID } from '../../data/gadgetInventory';

const QUIPS = {
  'precision-kit': 'A clean little click. Almost insulting.',
  'signal-scanner': 'The noise just confessed.',
  firewall: 'No, thank you. Return to sender.',
  'torque-driver': 'Stored patience, suddenly weaponized.',
  'echo-coil': 'The vault repeated its mistake.',
  'decoy-relay': 'Wrong wire. Excellent choice.',
  counterweight: 'The table just tilted back.',
  'quickset-clamp': 'First grip. Zero ceremony.',
  'cache-siphon': 'A useful amount of overreach.',
  'route-compass': 'Lost is merely uncalibrated.',
};

const SIGNATURE_COLORS = {
  'precision-kit': '#e8b078', 'signal-scanner': '#40a080', firewall: '#858998',
  'torque-driver': '#c87855', 'echo-coil': '#3a7cc4', 'decoy-relay': '#f06a6a',
  counterweight: '#c4956a', 'quickset-clamp': '#f0c48f', 'cache-siphon': '#72bc98',
  'route-compass': '#79aee9',
};

function playSignatureCue(index) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  [0, 7].forEach((offset, step) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = step ? 'triangle' : 'square';
    oscillator.frequency.value = 190 + index * 23 + offset * 11;
    gain.gain.setValueAtTime(0.0001, context.currentTime + step * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + step * 0.07 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + step * 0.07 + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + step * 0.07);
    oscillator.stop(context.currentTime + step * 0.07 + 0.18);
  });
  window.setTimeout(() => context.close(), 500);
}

export default function SignatureMoment({ event, actorName = 'Operator', reducedMotion = false, soundEnabled = false }) {
  const [visible, setVisible] = useState(Boolean(event));
  const announced = useRef(null);
  const gadget = event ? GADGET_CHASSIS_BY_ID[event.gadget] : null;

  useEffect(() => {
    if (!event || announced.current === event.id) return undefined;
    announced.current = event.id;
    setVisible(true);
    if (soundEnabled) playSignatureCue(gadget?.index || 0);
    if (!reducedMotion && navigator.vibrate) navigator.vibrate([18, 28, 32]);
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 3200 : 2400);
    return () => window.clearTimeout(timer);
  }, [event, gadget?.index, reducedMotion, soundEnabled]);

  if (!event || !gadget || !visible) return null;
  return (
    <aside className="signature-moment" style={{ '--signature-color': SIGNATURE_COLORS[gadget.id] }} role="status" aria-live="polite">
      <img src={gadget.image} alt="" width="128" height="128" />
      <div>
        <p className="signature-moment__eyebrow">{actorName} / Signature protocol</p>
        <p className="signature-moment__title">{gadget.effectName}</p>
        <p className="signature-moment__quip">{QUIPS[gadget.id]}</p>
      </div>
      <span className="signature-moment__stamp" aria-hidden="true">TRIGGERED</span>
    </aside>
  );
}
