export const GADGET_CINEMATICS = Object.freeze({
  'precision-kit': Object.freeze({ motion: 'needle', gesture: 'Dial / align / bite', callout: 'Tolerance locked' }),
  'signal-scanner': Object.freeze({ motion: 'sweep', gesture: 'Listen / isolate / mark', callout: 'Frequency isolated' }),
  firewall: Object.freeze({ motion: 'shutter', gesture: 'Brace / plate / hold', callout: 'Interference absorbed' }),
  'torque-driver': Object.freeze({ motion: 'flywheel', gesture: 'Load / turn / release', callout: 'Momentum discharged' }),
  'echo-coil': Object.freeze({ motion: 'resonance', gesture: 'Pulse / return / resolve', callout: 'Late echo acquired' }),
  'decoy-relay': Object.freeze({ motion: 'fork', gesture: 'Branch / bait / reverse', callout: 'False route armed' }),
  counterweight: Object.freeze({ motion: 'balance', gesture: 'Drop / catch / level', callout: 'Table pressure leveled' }),
  'quickset-clamp': Object.freeze({ motion: 'clamp', gesture: 'Open / snap / grip', callout: 'Opening held' }),
  'cache-siphon': Object.freeze({ motion: 'intake', gesture: 'Draw / sort / pocket', callout: 'Salvage recovered' }),
  'route-compass': Object.freeze({ motion: 'compass', gesture: 'Spin / resist / point', callout: 'Route held through noise' }),
});

export function getGadgetCinematic(gadgetId) {
  return GADGET_CINEMATICS[gadgetId] || Object.freeze({ motion: 'signature', gesture: 'Prime / trigger / settle', callout: 'Signature protocol' });
}
