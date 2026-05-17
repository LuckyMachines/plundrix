import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function ReplaysPage() {
  const [filter, setFilter] = useState('all');
  const [library, setLibrary] = useState(() => listReplayLibrary());
  const [importText, setImportText] = useState('');
  const generated = useMemo(
    () => replayGallerySeeds.map((seed) => buildReplayFromSeed(seed)),
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
    const next = importReplayLibraryJson(importText);
    setLibrary(next);
    setImportText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label">Replay Director</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">Replay Gallery</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
              Curated simulator stories with dramatic scoring, replay links, capture plans, and marketing proof metadata.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'comeback', 'close-finish', 'sabotage-heavy', 'short', 'long', 'weird', 'high-tension'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] ${
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gallery.map((item) => {
          const replay = replays.find((entry) => entry.id === item.id);
          return (
            <article key={item.id} className="rounded border border-vault-border bg-vault-surface/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">Score {item.score.toFixed(1)}</p>
                  <h2 className="mt-2 font-display text-xl text-vault-text">{item.title}</h2>
                </div>
                {item.marketingProof && (
                  <span className="rounded border border-oxide-green/40 bg-oxide-green/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-oxide-green">
                    proof
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
                <button type="button" onClick={() => navigator.clipboard?.writeText(item.share)} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                  Copy
                </button>
                <button type="button" onClick={() => replay && setLibrary(saveReplayToLibrary(replay))} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                  Save
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">Replay library</p>
          <button type="button" onClick={exportLibrary} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
            Export library
          </button>
        </div>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste replay library JSON"
          className="mt-3 min-h-[110px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text placeholder:text-vault-text-dim"
        />
        <button type="button" onClick={importLibrary} disabled={!importText.trim()} className="mt-3 min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text disabled:opacity-40">
          Import library
        </button>
      </section>
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
