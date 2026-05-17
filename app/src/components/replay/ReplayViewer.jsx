import { useEffect, useMemo, useState } from 'react';
import HighlightRail from './HighlightRail';
import ReplayTimeline from './ReplayTimeline';
import {
  exportReplayJson,
  exportReplayMarkdown,
  saveReplayToLibrary,
} from '../../lib/replayDirector';

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReplayViewer({ replay, comparison }) {
  const rounds = useMemo(
    () => [...new Set(replay.timeline.map((item) => item.round))],
    [replay],
  );
  const [activeRound, setActiveRound] = useState(rounds[0] || 1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const [cinematicMode, setCinematicMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(true);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowRight') {
        setActiveRound((round) => Math.min(rounds[rounds.length - 1] || round, round + 1));
      }
      if (event.key === 'ArrowLeft') {
        setActiveRound((round) => Math.max(1, round - 1));
      }
      if (event.key === ' ') {
        event.preventDefault();
        setPlaying((value) => !value);
      }
      const number = Number(event.key);
      if (Number.isInteger(number) && number > 0 && replay.highlights[number - 1]) {
        setActiveRound(replay.highlights[number - 1].round);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [replay.highlights, rounds]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setActiveRound((round) => {
        const currentIndex = rounds.indexOf(round);
        if (currentIndex >= rounds.length - 1) {
          setPlaying(false);
          return round;
        }
        return rounds[currentIndex + 1] || round;
      });
    }, speed);
    return () => window.clearInterval(timer);
  }, [playing, rounds, speed]);

  const activeRoundItems = replay.timeline.filter((item) => item.round === activeRound);
  const activePlayers = activeRoundItems[0]?.snapshot?.afterPlayers || [];

  return (
    <div className={cinematicMode ? 'min-h-screen bg-vault-dark' : ''}>
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="label">Replay Director</p>
            <h1 className="mt-2 font-display text-3xl text-vault-text">{replay.title}</h1>
            <p className="mt-2 text-sm text-vault-text-dim">{replay.subtitle}</p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-vault-text">{replay.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
            <Metric label="Score" value={replay.dramaticScore.toFixed(1)} />
            <Metric label="Rounds" value={replay.summary.rounds} />
            <Metric label="Winner" value={replay.summary.winnerName || 'None'} />
            <Metric label="Tags" value={replay.tags.slice(0, 2).join(', ') || 'clean'} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ControlButton onClick={() => setActiveRound((round) => Math.max(1, round - 1))} label="Previous round">
            Prev
          </ControlButton>
          <ControlButton onClick={() => setPlaying((value) => !value)} label={playing ? 'Pause replay' : 'Play replay'}>
            {playing ? 'Pause' : 'Play'}
          </ControlButton>
          <ControlButton onClick={() => setActiveRound((round) => Math.min(rounds[rounds.length - 1] || round, round + 1))} label="Next round">
            Next
          </ControlButton>
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            aria-label="Replay speed"
            className="control max-w-[130px]"
          >
            <option value={1800}>0.75x</option>
            <option value={1200}>1x</option>
            <option value={700}>1.5x</option>
          </select>
          <ControlButton onClick={() => setCinematicMode((value) => !value)} label="Toggle cinematic mode">
            Cinematic
          </ControlButton>
          <ControlButton onClick={() => setAnalysisMode((value) => !value)} label="Toggle analysis mode">
            Analysis
          </ControlButton>
          <ControlButton onClick={() => navigator.clipboard?.writeText(replay.shareUrl)} label="Copy share link">
            Copy link
          </ControlButton>
          <ControlButton onClick={() => saveReplayToLibrary(replay)} label="Save replay">
            Save
          </ControlButton>
          <ControlButton onClick={() => downloadText(`${replay.id}.json`, exportReplayJson(replay), 'application/json')} label="Export JSON">
            JSON
          </ControlButton>
          <ControlButton onClick={() => downloadText(`${replay.id}.md`, exportReplayMarkdown(replay), 'text/markdown')} label="Export Markdown">
            Markdown
          </ControlButton>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Round {activeRound}</p>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">
              {activeRoundItems[0]?.snapshot?.tensionLabel || 'quiet'}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {activePlayers.map((player) => (
              <article key={player.id} className="rounded border border-vault-border bg-vault-panel/55 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl text-vault-text">{player.name}</h2>
                  <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                    player.stunned ? 'border-signal-red/50 text-signal-red' : 'border-oxide-green/40 text-oxide-green'
                  }`}>
                    {player.stunned ? 'Stunned' : 'Ready'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Metric label="Locks" value={player.locksCracked} />
                  <Metric label="Tools" value={player.tools} />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded border border-vault-border bg-vault-panel/55 p-3">
            <p className="label">Story beats</p>
            <div className="mt-2 space-y-2">
              {replay.beats.map((beat) => (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => setActiveRound(beat.round)}
                  className="block w-full rounded bg-vault-dark px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-panel"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide-green">
                    R{beat.round} {beat.label}
                  </span>
                  <span className="mt-1 block">{beat.text}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <ReplayTimeline
          timeline={replay.timeline}
          activeRound={activeRound}
          onJump={setActiveRound}
          analysisMode={analysisMode}
        />
      </div>

      <div className="mt-4">
        <HighlightRail highlights={replay.highlights} activeRound={activeRound} onJump={setActiveRound} />
      </div>

      {comparison && (
        <section className="mt-4 rounded border border-vault-border bg-vault-surface/75 p-4">
          <p className="label">Before / After</p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Baseline" value={comparison.baseline.dramaticScore.toFixed(1)} />
            <Metric label="Tuned" value={comparison.tuned.dramaticScore.toFixed(1)} />
            <Metric label="Delta" value={comparison.scoreDelta.toFixed(1)} />
            <Metric label="Changed rounds" value={comparison.timelineComparison.filter((item) => item.changed).length} />
          </div>
        </section>
      )}
    </div>
  );
}

function ControlButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:bg-vault-panel"
    >
      {children}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-dark/75 p-3">
      <div className="label">{label}</div>
      <div className="mt-2 truncate font-display text-lg text-vault-text">{value}</div>
    </div>
  );
}
