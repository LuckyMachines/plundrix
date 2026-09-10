const CREW_TONES = ['coral', 'cyan', 'green', 'gold'];
const CREW_DEVICES = [null, '/images/parts/rook-device.webp', '/images/parts/mara-device.webp', '/images/parts/vesper-device.webp'];
const TABLE_STYLES = ['You', 'Leader hunter', 'Tool hoarder', 'Saboteur'];

function MaskInsignia({ tone = 'cyan' }) {
  return (
    <span className="caper-mask-insignia" data-tone={tone} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path className="caper-mask-insignia__diamond" d="M24 3 45 24 24 45 3 24Z" />
        <path className="caper-mask-insignia__hat" d="M13 20h22l-4-7H18Z" />
        <path className="caper-mask-insignia__face" d="M15 22h18v9l-9 6-9-6Z" />
        <path className="caper-mask-insignia__eyes" d="M18 26h5l-2 3h-3Zm7 0h5v3h-3Z" />
      </svg>
    </span>
  );
}

export function MissionStatusPanel({ round, modeLabel, objectives, pressurePercent, pressureValue, pressureMax, pressureLabel, pressureDetail }) {
  return (
    <section className="instant-mission-status" aria-labelledby="instant-round-heading">
      <div className="instant-round-plaque">
        <p className="font-mono text-micro uppercase tracking-brand text-tungsten">{modeLabel} operation</p>
        <h1 id="instant-round-heading" className="font-display uppercase text-vault-text">Round {round}</h1>
        <p className="instant-active-beacon"><span aria-hidden="true" /> Active</p>
      </div>

      <div className="instant-objective-sheet">
        <h2>Objectives</h2>
        <ul>
          {objectives.map((objective) => (
            <li key={objective.label} data-complete={objective.complete}>
              <span aria-hidden="true" />
              <span>{objective.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="instant-threat-gauge">
        <div className="instant-threat-gauge__heading"><span>Table pressure</span><strong>{pressureLabel}</strong></div>
        <div className="instant-threat-gauge__body">
          <div className="instant-threat-dial" style={{ '--threat-angle': `${pressurePercent * 3.6}deg` }} aria-hidden="true">
            <span>{pressureValue}/{pressureMax}</span>
          </div>
          <div className="instant-threat-gauge__readout">
            <div className="instant-threat-gauge__track" role="progressbar" aria-label="Leading lock progress" aria-valuemin="0" aria-valuemax={pressureMax} aria-valuenow={pressureValue}>
              <span style={{ width: `${pressurePercent}%` }} />
            </div>
            <p><span className="instant-threat-gauge__lamp" aria-hidden="true" /> {pressureDetail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CrewReadinessRail({ players, totalLocks }) {
  const leaderLocks = Math.max(0, ...players.map((candidate) => candidate.locksCracked));
  const leaders = players.filter((candidate) => candidate.locksCracked === leaderLocks);
  const tableState = leaderLocks === 0 || leaders.length > 1 ? 'Table even' : `${leaders[0].name} leads`;
  return (
    <section className="instant-crew-briefing" aria-labelledby="instant-crew-heading">
      <div className="instant-crew-briefing__heading">
        <h2 id="instant-crew-heading">Table positions</h2>
        <span>{tableState}</span>
      </div>
      <ul>
        {players.map((candidate, index) => (
          <li key={candidate.id} data-current={candidate.id === 'player-1'} data-stunned={candidate.stunned}>
            <MaskInsignia tone={CREW_TONES[index]} />
            <span className="instant-crew-briefing__identity">
              <strong>{candidate.name}</strong>
              <small>{TABLE_STYLES[index]} / {candidate.locksCracked} of {totalLocks} locks / {candidate.tools} tools</small>
            </span>
            <span className="instant-crew-briefing__signals">
              {CREW_DEVICES[index] && <img src={CREW_DEVICES[index]} alt={`${candidate.name} gadget`} width="48" height="48" />}
              <span className="instant-crew-briefing__state" aria-label={candidate.stunned ? 'Stunned' : candidate.locksCracked === leaderLocks && leaderLocks > 0 ? 'Leading' : 'Active'}>
                {candidate.stunned ? '!' : candidate.locksCracked === leaderLocks && leaderLocks > 0 ? '1' : 'ON'}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="instant-crew-route" aria-hidden="true">
        {players.map((candidate, index) => <span key={candidate.id} data-tone={CREW_TONES[index]} style={{ '--player-progress': `${(candidate.locksCracked / totalLocks) * 100}%` }} />)}
      </div>
    </section>
  );
}

export function OperationFile({ player, leader, tablePosition, totalLocks, maxTools, selectedActionLabel, selectedActionMetric, selectedActionPreview, round }) {
  const remaining = Math.max(0, totalLocks - player.locksCracked);
  const directive = tablePosition === 'Table even'
    ? 'The table is level. Choose whether to advance, prepare, or disrupt.'
    : leader.id === player.id
      ? 'Protect the lead. Expect interference on the next reveal.'
      : `${leader.name} has the inside line. Change tempo before the trail goes cold.`;

  return (
    <aside className="instant-operation-file" aria-labelledby="instant-file-heading">
      <div className="instant-operation-file__clip" aria-hidden="true" />
      <div className="instant-operation-file__identity">
        <MaskInsignia tone="gold" />
        <div><p>Restricted / active</p><h2 id="instant-file-heading">Operation file</h2></div>
      </div>
      <dl>
        <div><dt>Your progress</dt><dd>{player.locksCracked}/{totalLocks} locks</dd></div>
        <div><dt>Table position</dt><dd>{tablePosition}</dd></div>
        <div><dt>Tools carried</dt><dd>{player.tools}/{maxTools}</dd></div>
        <div><dt>Current plan</dt><dd>{selectedActionLabel}</dd></div>
      </dl>

      <div className="instant-action-intel">
        <p>Expected effect</p>
        <strong>{selectedActionMetric}</strong>
        <span>{selectedActionPreview}</span>
      </div>

      <div className="instant-file-directive">
        <div>
          <p>Handler directive</p>
          <strong>{directive}</strong>
        </div>
        <span aria-label={`Operation code round ${round}, ${remaining} locks sealed`}>
          R{String(round).padStart(2, '0')} / L{String(remaining).padStart(2, '0')}
        </span>
      </div>
    </aside>
  );
}
