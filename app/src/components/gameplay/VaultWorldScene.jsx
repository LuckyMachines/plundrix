import { VAULT_WORLD } from '../../data/vaultWorld';

const RIVAL_STATIONS = ['player-2', 'player-3', 'player-4'];
const RIVAL_PERSONAS = ['leader-hunter', 'tool-hoarder', 'saboteur'];
const ACTION_TOOLS = [
  ['pick', '/images/parts/pick-tool.webp'],
  ['search', '/images/parts/search-kit.webp'],
  ['sabotage', '/images/parts/sabotage-cable.webp'],
];
const DUST = Array.from({ length: 9 }, (_, index) => index);
const DAMAGE = Array.from({ length: 5 }, (_, index) => index);

function WorldRib({ side, index }) {
  return <span className={`vault-world__rib vault-world__rib--${side}`} data-rib={index} />;
}

function RivalStation({ player, index, affectedOperator, leaderLocks }) {
  return (
    <span
      className="vault-world__station"
      data-station={index + 1}
      data-persona={RIVAL_PERSONAS[index]}
      data-stunned={Boolean(player?.stunned)}
      data-affected={affectedOperator === player?.id}
      data-leading={Boolean(leaderLocks && player?.locksCracked === leaderLocks)}
    >
      <i className="vault-world__station-motif" />
      <i className="vault-world__station-screen" />
      <i className="vault-world__station-body" />
      <i className="vault-world__station-signal" />
      <span className="vault-world__rival" aria-hidden="true">
        <i className="vault-world__rival-head" />
        <i className="vault-world__rival-torso" />
        <i className="vault-world__rival-hand vault-world__rival-hand--left" />
        <i className="vault-world__rival-hand vault-world__rival-hand--right" />
      </span>
    </span>
  );
}

export default function VaultWorldScene({ worldState, players = [] }) {
  const rivals = RIVAL_STATIONS.map((id) => players.find((player) => player.id === id));
  const leaderLocks = Math.max(0, ...players.map((player) => Number(player?.locksCracked) || 0));
  const pressure = worldState.progress >= 0.8 ? 'critical' : worldState.progress >= 0.4 ? 'rising' : 'calm';

  return (
    <div
      className="vault-world"
      data-world={VAULT_WORLD.id}
      data-world-version={VAULT_WORLD.version}
      data-phase={worldState.phase}
      data-route={worldState.route}
      data-selected-route={worldState.selectedRoute}
      data-outcome-route={worldState.outcomeRoute}
      data-pressure={pressure}
      data-damage={worldState.damageLevel}
      data-round-age={Math.min(5, worldState.round)}
      style={{ '--vault-world-progress': worldState.progress }}
      aria-hidden="true"
    >
      <div className="vault-world__backdrop" data-plane="architecture" />
      <div className="vault-world__practicals"><i /><i /><i /><i /></div>
      <div className="vault-world__room" data-plane="architecture">
        <div className="vault-world__ceiling"><i /><i /><i /></div>
        <div className="vault-world__wall vault-world__wall--left" />
        <div className="vault-world__wall vault-world__wall--right" />
        <div className="vault-world__rear-frame">
          {Array.from({ length: 5 }, (_, index) => <i key={index} data-open={index < worldState.locksOpen} />)}
        </div>
        <div className="vault-world__story" aria-hidden="true">
          <i data-prop="warning" />
          <i data-prop="ledger" />
          <i data-prop="contraband" />
          <i data-prop="cable-left" />
          <i data-prop="cable-right" />
        </div>
        {Array.from({ length: 4 }, (_, index) => <WorldRib key={`left-${index}`} side="left" index={index} />)}
        {Array.from({ length: 4 }, (_, index) => <WorldRib key={`right-${index}`} side="right" index={index} />)}
      </div>
      <div className="vault-world__stations" data-plane="rivals">
        {rivals.map((player, index) => (
          <RivalStation key={RIVAL_STATIONS[index]} player={player} index={index} affectedOperator={worldState.affectedOperator} leaderLocks={leaderLocks} />
        ))}
      </div>
      <div className="vault-world__floor" data-plane="mechanism">
        <i data-route="pick" />
        <i data-route="search" />
        <i data-route="sabotage" />
      </div>
      <div className="vault-world__bench" data-plane="workbench">
        <i /><i /><i />
        <div className="vault-world__tool-set">
          {ACTION_TOOLS.map(([route, source]) => <img key={route} data-route={route} src={source} alt="" />)}
        </div>
      </div>
      <div className="vault-world__damage" aria-hidden="true">
        {DAMAGE.map((mark) => <i key={mark} data-visible={mark < worldState.damageLevel} style={{ '--damage': mark }} />)}
      </div>
      <div className="vault-world__reflections" aria-hidden="true"><i /><i /><i /></div>
      <div className="vault-world__debris" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="vault-world__smoke" aria-hidden="true"><i /><i /></div>
      <div className="vault-world__dust" aria-hidden="true">
        {DUST.map((particle) => <i key={particle} style={{ '--dust': particle }} />)}
      </div>
      <div className="vault-world__wear" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="vault-world__atmosphere" />
    </div>
  );
}
