const CREW_ROLES = ['Dealer', 'Hacker', 'Breacher', 'Scout'];
const CREW_TONES = ['coral', 'cyan', 'green', 'gold'];
const CREW_DEVICES = [null, '/images/parts/rook-device.webp', '/images/parts/mara-device.webp', '/images/parts/vesper-device.webp'];

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

export function MissionStatusPanel({ round, modeLabel, objectives, threatPercent, threatLabel }) {
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
        <div className="instant-threat-gauge__heading"><span>Threat level</span><strong>{threatLabel}</strong></div>
        <div className="instant-threat-gauge__track" role="progressbar" aria-label="Threat level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={threatPercent}>
          <span style={{ width: `${threatPercent}%` }} />
        </div>
        <p><span className="instant-threat-gauge__lamp" aria-hidden="true" /> Alert rising / {threatPercent}%</p>
      </div>
    </section>
  );
}

export function CrewReadinessRail({ players, totalLocks }) {
  const readyCount = players.filter((candidate) => !candidate.stunned).length;
  return (
    <section className="instant-crew-briefing" aria-labelledby="instant-crew-heading">
      <div className="instant-crew-briefing__heading">
        <h2 id="instant-crew-heading">Crew briefing</h2>
        <span>{readyCount}/{players.length} ready</span>
      </div>
      <ul>
        {players.map((candidate, index) => (
          <li key={candidate.id} data-current={candidate.id === 'player-1'} data-stunned={candidate.stunned}>
            <MaskInsignia tone={CREW_TONES[index]} />
            <span className="instant-crew-briefing__identity">
              <strong>{candidate.name}</strong>
              <small>{CREW_ROLES[index]} / {candidate.locksCracked} of {totalLocks}</small>
            </span>
            <span className="instant-crew-briefing__signals">
              {CREW_DEVICES[index] && <img src={CREW_DEVICES[index]} alt={`${candidate.name} gadget`} width="48" height="48" />}
              <span className="instant-crew-briefing__state" aria-label={candidate.stunned ? 'Stunned' : 'Ready'}>
                {candidate.stunned ? '!' : 'OK'}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="instant-crew-route" aria-hidden="true">
        {players.map((candidate, index) => <span key={candidate.id} data-tone={CREW_TONES[index]} data-active={!candidate.stunned} />)}
      </div>
    </section>
  );
}

export function OperationFile({ player, leader, totalLocks, selectedActionLabel, materials, round }) {
  const remaining = Math.max(0, totalLocks - player.locksCracked);
  const security = remaining > 3 ? 'High' : remaining > 1 ? 'Medium' : 'Low';
  const pressure = leader.id === player.id ? 'You lead' : `${leader.name} +${leader.locksCracked - player.locksCracked}`;
  const directive = leader.id === player.id
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
        <div><dt>Vault security</dt><dd>{security}</dd></div>
        <div><dt>Sealed locks</dt><dd>{remaining}/{totalLocks}</dd></div>
        <div><dt>Rival pressure</dt><dd>{pressure}</dd></div>
        <div><dt>Current plan</dt><dd>{selectedActionLabel}</dd></div>
      </dl>

      <div className="instant-potential-loot">
        <p>Potential loot</p>
        <div>
          {materials.slice(0, 4).map((material) => (
            <span key={material.id} title={material.label}>
              <img src={material.image} alt="" width="96" height="96" />
            </span>
          ))}
          <span aria-label="Unknown reward">?</span>
        </div>
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
