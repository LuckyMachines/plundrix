import { ProofCard } from './CohesionCards';

const DEFAULT_EVIDENCE = [
  {
    type: 'simulator proof',
    title: 'Same-engine simulator',
    status: 'ready',
    summary: 'Runs operations, batches, ruleset comparisons, and replay links from the Plundrix engine.',
    command: 'npm run simulate',
  },
  {
    type: 'replay proof',
    title: 'Replay Director',
    status: 'ready',
    summary: 'Turns operation outcomes into dramatic replay proof and shareable match stories.',
    command: 'npm run replay:direct',
  },
  {
    type: 'ghost proof',
    title: 'Player Telemetry Ghosts',
    status: 'ready',
    summary: 'Tests operator archetypes for agency, fairness, frustration, and replay contribution.',
    command: 'npm run ghosts:run -- --budget smoke --markdown',
  },
  {
    type: 'mutation proof',
    title: 'Rule Mutation Time Machine',
    status: 'ready',
    summary: 'Compares rule changes across simulation, replay drama, ghost health, and contract impact.',
    command: 'npm run mutate:rules -- --budget smoke --markdown',
  },
  {
    type: 'fun proof',
    title: 'Fun Check',
    status: 'ready',
    summary: 'Scores agency, drama, readability, rhythm, and action variety from deterministic simulator runs.',
    command: 'npm run fun:check',
  },
  {
    type: 'launch proof',
    title: 'Launch Copilot',
    status: 'ready',
    summary: 'Collects release checks, route checks, proof packets, risk register, and rollback steps.',
    command: 'npm run launch:copilot -- --target internal-playtest --markdown',
  },
];

export default function LatestEvidence({ compact = false, items = DEFAULT_EVIDENCE }) {
  return (
    <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">Latest evidence</p>
          <h2 className="mt-2 font-display text-2xl text-vault-text">One proof language across the product loop</h2>
        </div>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
        {items.slice(0, compact ? 3 : items.length).map((item) => (
          <ProofCard
            key={`${item.type}-${item.title}`}
            type={item.type}
            title={item.title}
            status={item.status}
            summary={item.summary}
            command={item.command}
            tone="info"
          />
        ))}
      </div>
    </section>
  );
}
