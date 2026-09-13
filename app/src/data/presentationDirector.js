import presentationManifest from '../../presentation/manifest.json' with { type: 'json' };

export const PREMIUM_PRESENTATION = Object.freeze(presentationManifest);

const ACTION_BY_ID = Object.freeze(Object.fromEntries(
  Object.entries(presentationManifest.actions).map(([identity, action]) => [action.id, identity]),
));

export function normalizePresentationAction(action, fallback = 'pick') {
  if (presentationManifest.actions[action]) return action;
  return ACTION_BY_ID[Number(action)] || fallback;
}

export function presentationTimings(reducedMotion = false) {
  return Object.freeze({
    ...(reducedMotion ? presentationManifest.timings.reduced : presentationManifest.timings.standard),
  });
}

export function deriveRoundPresentation({
  phase = 'planning',
  action = 'pick',
  outcome = null,
  players = [],
  round = 1,
} = {}) {
  const route = normalizePresentationAction(outcome?.action, normalizePresentationAction(action));
  const profile = presentationManifest.actions[route];
  const actor = players.find((player) => player.id === outcome?.actor);
  const target = players.find((player) => player.id === outcome?.target);
  const successful = outcome ? Boolean(outcome.success) : null;
  const title = phase === 'sealed'
    ? `${profile.label} sealed`
    : phase === 'revealing'
      ? 'The table reveals'
      : phase === 'impact'
        ? successful ? profile.successTitle : profile.failureTitle
        : phase === 'recovery'
          ? 'Next move armed'
          : 'Choose the next move';
  const detail = phase === 'impact' && outcome?.message
    ? outcome.message
    : phase === 'revealing'
      ? 'Four intentions. One simultaneous consequence.'
      : phase === 'sealed'
        ? `${profile.verb}. No take-backs.`
        : phase === 'recovery'
          ? 'Read the room. Change the plan.'
          : profile.verb;

  return Object.freeze({
    phase,
    route,
    profile,
    successful,
    actorName: actor?.name || 'Operator',
    targetName: target?.name || null,
    title,
    detail,
    round,
  });
}

export function cuesForOutcome(outcome, fallbackAction = 'pick', { winner = false, gadget = false } = {}) {
  const route = normalizePresentationAction(outcome?.action, normalizePresentationAction(fallbackAction));
  const profile = presentationManifest.actions[route];
  const cues = ['round.impact', outcome?.success ? profile.successCue : profile.failureCue];
  if (gadget) cues.push('gadget.signature');
  if (winner) cues.push('game.win');
  return cues;
}

export function emitPresentationCues(cues, detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('plundrix:sound-cues', {
    detail: { cues: [...new Set(cues)].slice(0, 4), ...detail },
  }));
}
