import { GADGET_CHASSIS_BY_ID } from '../../data/gadgetInventory';
import { deriveRoundPresentation } from '../../data/presentationDirector';

const PARTICLES = Array.from({ length: 14 }, (_, index) => index);

export default function RoundTheater({
  phase = 'planning',
  action = 'pick',
  outcome = null,
  players = [],
  round = 1,
  gadgetEvent = null,
}) {
  const presentation = deriveRoundPresentation({ phase, action, outcome, players, round });
  const gadget = gadgetEvent ? GADGET_CHASSIS_BY_ID[gadgetEvent.gadget] : null;
  const active = phase !== 'planning';

  return (
    <div
      className="round-theater"
      data-theater-phase={phase}
      data-route={presentation.route}
      data-success={presentation.successful === null ? 'pending' : presentation.successful}
      aria-hidden={!active}
    >
      <div className="round-theater__vignette" />
      <div className="round-theater__scan" />
      <div className="round-theater__iris"><i /><i /></div>
      <div className="round-theater__particles" aria-hidden="true">
        {PARTICLES.map((particle) => <i key={particle} style={{ '--particle': particle }} />)}
      </div>
      <div className="round-theater__tool" aria-hidden="true">
        <span />
        <img src={presentation.profile.toolImage} alt="" width="256" height="256" />
      </div>
      {gadget && (
        <div className="round-theater__gadget" aria-hidden="true">
          <img src={gadget.image} alt="" width="256" height="256" />
          <span>{gadget.effectName}</span>
        </div>
      )}
      <div className="round-theater__slate" role={active ? 'status' : undefined} aria-live="polite">
        <span>Round {round} / {presentation.profile.label}</span>
        <strong>{presentation.title}</strong>
        <small>{presentation.detail}</small>
        {presentation.targetName && <em>Target / {presentation.targetName}</em>}
      </div>
      <div className="round-theater__impact-ring" aria-hidden="true" />
    </div>
  );
}
