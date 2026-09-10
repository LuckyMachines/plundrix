import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import { GADGET_CHASSIS } from '../data/gadgetInventory';
import { getGadgetMastery, readInventory } from '../lib/inventoryStore';
import { readChronicle } from '../lib/playerChronicle';
import { careerObjectives, localCareerRank, readLocalProfile } from '../lib/playerCareer';
import { listReplayLibrary } from '../lib/replayDirector';
import { readVaultRunHistory } from '../lib/vaultRun';

export default function CareerPage() {
  const profile = readLocalProfile();
  const inventory = readInventory();
  const chronicle = readChronicle();
  const replays = listReplayLibrary();
  const runs = readVaultRunHistory();
  const rank = localCareerRank(profile.xp);
  const objectives = careerObjectives({ profile, inventory, replays, runs });
  const mastered = GADGET_CHASSIS.map((gadget) => ({ gadget, mastery: getGadgetMastery(inventory, gadget.id) }))
    .filter(({ mastery }) => mastery.xp > 0)
    .sort((a, b) => b.mastery.xp - a.mastery.xp);
  const bestRun = runs.reduce((best, run) => Math.max(best, Number(run.score) || 0), 0);
  const winRate = profile.games ? Math.round((profile.wins / profile.games) * 100) : 0;

  return (
    <div className="career-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <Seo title="Local Operator Career | Plundrix" description="Review your Plundrix identity, operations, rivals, collection, Vault Runs, and next objectives on this device." path="/career" />
      <header className="career-header border-b border-vault-border pb-8">
        <p className="font-mono text-micro uppercase tracking-beacon text-oxide-green">Local operator record / this device</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div><h1 className="font-display text-6xl uppercase leading-none text-vault-text sm:text-8xl">{profile.name}</h1><p className="mt-3 font-mono text-xs uppercase tracking-label text-tungsten">Rank {rank.level} / {rank.title}</p></div>
          <Link to="/play" className="inline-flex min-h-[50px] items-center bg-tungsten-bright px-6 font-mono text-xs font-bold uppercase tracking-label text-vault-dark">Play next operation -&gt;</Link>
        </div>
      </header>

      <section className="career-metrics mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Career summary">
        <Metric label="Operations" value={profile.games} />
        <Metric label="Escapes" value={profile.wins} />
        <Metric label="Win rate" value={`${winRate}%`} />
        <Metric label="Best run" value={bestRun.toLocaleString()} />
        <Metric label="Builds" value={`${inventory.ownedIds.length}/1200`} />
      </section>

      <div className="career-main mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="border border-vault-border bg-vault-surface p-5 sm:p-7">
          <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Next objectives</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {objectives.map((item, index) => <Link key={item.id} to={item.to} className="group min-h-[148px] border border-vault-border bg-vault-dark/45 p-4 hover:border-tungsten/55"><span className="font-mono text-micro uppercase tracking-label text-oxide-green">Objective 0{index + 1}</span><h2 className="mt-3 font-display text-2xl uppercase text-vault-text">{item.label}</h2><p className="mt-2 text-xs leading-5 text-vault-text-dim">{item.detail}</p><span className="mt-4 block font-mono text-micro uppercase text-tungsten">Continue -&gt;</span></Link>)}
          </div>
        </section>

        <section className="border border-vault-border bg-vault-surface p-5 sm:p-7">
          <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Rival ledger</p>
          <div className="mt-4 space-y-3">{Object.entries(chronicle.rivals).map(([name, rival]) => <article key={name} className="border-t border-vault-border pt-3"><div className="flex items-center justify-between"><h2 className="font-display text-2xl uppercase text-vault-text">{name}</h2><span className="font-mono text-micro uppercase text-signal-red">Grudge {rival.grudge}/5</span></div><p className="mt-1 text-xs text-vault-text-dim">Record {rival.playerWins}-{rival.rivalWins} / {rival.encounters} encounters / {rival.toolsStolen} tools taken</p></article>)}</div>
        </section>
      </div>

      <div className="career-archives mt-6 grid gap-6 lg:grid-cols-3">
        <CareerList title="Vault Run archive" empty="No runs archived yet." items={runs.slice(0, 5).map((run) => ({ key: run.runId, label: run.status === 'COMPLETE' ? 'Escaped' : 'Caught', detail: `${run.score.toLocaleString()} points / ${run.rounds} rounds` }))} to="/vault-run" />
        <CareerList title="Exact replays" empty="Finish an Instant Play operation to save one." items={replays.slice(0, 5).map((replay) => ({ key: replay.id, label: replay.title, detail: `${replay.summary?.rounds || replay.timeline?.length || 0} rounds / winner ${replay.summary?.winnerName || 'unknown'}` }))} to="/replays" />
        <CareerList title="Device mastery" empty="Activate a gadget in a run to begin mastery." items={mastered.slice(0, 5).map(({ gadget, mastery }) => ({ key: gadget.id, label: gadget.label, detail: `${mastery.title} / ${mastery.xp} XP` }))} to="/workshop" />
      </div>

      <p className="career-footnote mt-8 text-xs leading-5 text-vault-text-dim">Practice career data is stored only in this browser. Live Sepolia results remain available in <Link className="text-tungsten underline underline-offset-4" to="/sessions">operation history</Link>.</p>
    </div>
  );
}

function Metric({ label, value }) {
  return <article className="career-metric border border-vault-border bg-vault-surface p-4"><p className="font-mono text-micro uppercase tracking-label text-vault-text-dim">{label}</p><p className="mt-2 font-display text-3xl uppercase text-vault-text">{value}</p></article>;
}

function CareerList({ title, empty, items, to }) {
  return <section className="border border-vault-border bg-vault-surface p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl uppercase text-vault-text">{title}</h2><Link to={to} className="font-mono text-micro uppercase text-tungsten">Open -&gt;</Link></div><div className="mt-4 space-y-3">{items.length ? items.map((item) => <article key={item.key} className="border-t border-vault-border pt-3"><p className="text-sm text-vault-text">{item.label}</p><p className="mt-1 font-mono text-micro uppercase text-vault-text-dim">{item.detail}</p></article>) : <p className="text-sm leading-6 text-vault-text-dim">{empty}</p>}</div></section>;
}
