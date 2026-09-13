import { VAULT_WORLD } from '../../data/vaultWorld';

const RIVAL_STATIONS = ['player-2', 'player-3', 'player-4'];

function WorldRib({ side, index }) {
  return <span className={`vault-world__rib vault-world__rib--${side}`} data-rib={index} />;
}

function RivalStation({ player, index, affectedOperator }) {
  return (
    <span
      className="vault-world__station"
      data-station={index + 1}
      data-stunned={Boolean(player?.stunned)}
      data-affected={affectedOperator === player?.id}
    >
      <i className="vault-world__station-screen" />
      <i className="vault-world__station-body" />
    </span>
  );
}

export default function VaultWorldScene({ worldState, players = [] }) {
  const rivals = RIVAL_STATIONS.map((id) => players.find((player) => player.id === id));

  return (
    <div
      className="vault-world"
      data-world={VAULT_WORLD.id}
      data-world-version={VAULT_WORLD.version}
      data-phase={worldState.phase}
      data-route={worldState.route}
      data-selected-route={worldState.selectedRoute}
      data-outcome-route={worldState.outcomeRoute}
      style={{ '--vault-world-progress': worldState.progress }}
      aria-hidden="true"
    >
      <div className="vault-world__backdrop" data-plane="architecture" />
      <div className="vault-world__room" data-plane="architecture">
        <div className="vault-world__ceiling"><i /><i /><i /></div>
        <div className="vault-world__wall vault-world__wall--left" />
        <div className="vault-world__wall vault-world__wall--right" />
        <div className="vault-world__rear-frame">
          {Array.from({ length: 5 }, (_, index) => <i key={index} data-open={index < worldState.locksOpen} />)}
        </div>
        {Array.from({ length: 4 }, (_, index) => <WorldRib key={`left-${index}`} side="left" index={index} />)}
        {Array.from({ length: 4 }, (_, index) => <WorldRib key={`right-${index}`} side="right" index={index} />)}
      </div>
      <div className="vault-world__stations" data-plane="rivals">
        {rivals.map((player, index) => (
          <RivalStation key={RIVAL_STATIONS[index]} player={player} index={index} affectedOperator={worldState.affectedOperator} />
        ))}
      </div>
      <div className="vault-world__floor" data-plane="mechanism">
        <i data-route="pick" />
        <i data-route="search" />
        <i data-route="sabotage" />
      </div>
      <div className="vault-world__bench" data-plane="workbench"><i /><i /><i /></div>
      <div className="vault-world__atmosphere" />
    </div>
  );
}
