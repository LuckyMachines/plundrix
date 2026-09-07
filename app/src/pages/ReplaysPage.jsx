import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageIntro, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import { EmptyState } from '../components/cohesion/CohesionCards';
import { replayGallerySeeds } from '../data/replayGallery';
import {
  buildReplayFromSeed,
  buildReplayGalleryData,
  exportReplayLibraryJson,
  filterReplays,
  importReplayLibraryJson,
  listReplayLibrary,
  saveReplayToLibrary,
} from '../lib/replayDirector';
import { copyText } from '../lib/clipboard';
import { useToast } from '../context/ToastContext';

export default function ReplaysPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [library, setLibrary] = useState(() => listReplayLibrary());
  const [importText, setImportText] = useState('');
  const generated = useMemo(
    () => replayGallerySeeds.map((seed) => ({
      ...buildReplayFromSeed(seed),
      gallerySeedId: seed.id,
      title: seed.label,
    })),
    [],
  );
  const replays = filterReplays([...library, ...generated], filter);
  const gallery = buildReplayGalleryData(replays);

  const exportLibrary = () => {
    const blob = new Blob([exportReplayLibraryJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plundrix-replay-library.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLibrary = () => {
    try {
      const next = importReplayLibraryJson(importText);
      setLibrary(next);
      setImportText('');
      toast.success('Replay library imported.', { title: 'Library updated' });
    } catch (error) {
      toast.error(error?.message || 'That replay file could not be imported.', { title: 'Import failed' });
    }
  };

  const copyReplay = async (url) => {
    try {
      await copyText(url);
      toast.success('Replay link copied.', { title: 'Ready to share' });
    } catch (error) {
      toast.error(error?.message || 'The link could not be copied.', { title: 'Copy failed' });
    }
  };

  const saveReplay = (replay) => {
    setLibrary(saveReplayToLibrary(replay));
    toast.success('Replay saved to this device.', { title: 'Replay saved' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageIntro route="/replays" />
      <ProductLoopRail activeStep="replay" compact />
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label">Replay filters</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              Filter replays by the table story you want to inspect.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'comeback', 'close-finish', 'sabotage-heavy', 'high-tension'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`min-h-[44px] rounded border px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] ${
                  filter === item
                    ? 'border-tungsten bg-tungsten/10 text-tungsten'
                    : 'border-vault-border text-vault-text-dim hover:text-vault-text'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {gallery.length === 0 ? (
        <EmptyState
          missing="No replays in this filter."
          why="Replays are the memory layer for Plundrix operations. Change the filter or generate a new practice match."
          action={<button type="button" onClick={() => setFilter('all')} className="min-h-[44px] rounded border border-tungsten/55 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">Show all replays</button>}
        />
      ) : (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gallery.map((item) => {
          const replay = replays.find((entry) => entry.id === item.id);
          const gallerySeed = replayGallerySeeds.find((entry) => entry.id === replay?.gallerySeedId || entry.seed === replay?.seed);
          return (
            <article key={item.id} className="overflow-hidden rounded border border-vault-border bg-vault-surface/75">
              {gallerySeed?.image && (
                <div className="relative aspect-[16/9] overflow-hidden border-b border-vault-border bg-vault-dark">
                  <img
                    src={gallerySeed.image}
                    alt={gallerySeed.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 hover:scale-[1.035]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-vault-dark/60 to-transparent" />
                </div>
              )}
              <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">Simulated practice replay</p>
                  <h2 className="mt-2 font-display text-xl text-vault-text">{item.title}</h2>
                </div>
                {item.marketingProof && (
                  <span className="rounded border border-oxide-green/40 bg-oxide-green/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-oxide-green">
                    sample
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="Rounds" value={item.rounds} />
                <Metric label="Winner" value={item.winner || 'None'} />
                <Metric label="Swings" value={item.sabotageSwings} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded border border-vault-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-vault-text-dim">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/replay/${item.id}${replay?.shareUrl.includes('?') ? replay.shareUrl.slice(replay.shareUrl.indexOf('?')) : ''}`} className="min-h-[44px] rounded border border-tungsten/55 px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">
                  Open replay
                </Link>
                <button type="button" onClick={() => copyReplay(item.share)} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                  Copy
                </button>
                <button type="button" onClick={() => replay && saveReplay(replay)} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                  Save
                </button>
              </div>
              </div>
            </article>
          );
        })}
      </section>
      )}

      <details className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <summary className="min-h-[44px] cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">Advanced replay tools</summary>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-vault-text-dim">Export your saved library or import replay JSON.</p>
          <button type="button" onClick={exportLibrary} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">Export library</button>
        </div>
        <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste replay library JSON" aria-label="Replay library JSON" className="mt-3 min-h-[110px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text placeholder:text-vault-text-dim" />
        <button type="button" onClick={importLibrary} disabled={!importText.trim()} className="mt-3 min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text disabled:opacity-40">Import library</button>
      </details>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/55 p-2">
      <div className="label">{label}</div>
      <div className="mt-1 truncate font-display text-base text-vault-text">{value}</div>
    </div>
  );
}
