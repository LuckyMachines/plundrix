import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import {
  SIM_ACTION,
  SIM_GADGETS,
  buildStrategyActionMap,
  createInitialSimulation,
  getPickChance,
  getSearchChance,
  resolveSimulationRound,
} from '../lib/plundrixEngine';

const MODES = {
  blitz: {
    label: 'Blitz',
    description: 'Three locks and a 45-second live-turn target.',
    rules: { totalLocks: 3, roundTimeoutSeconds: 45 },
  },
  classic: {
    label: 'Classic',
    description: 'The full five-lock vault race.',
    rules: { totalLocks: 5, roundTimeoutSeconds: 300 },
  },
  tactical: {
    label: 'Tactical',
    description: 'Five locks with one-use operator gadgets.',
    rules: { totalLocks: 5, roundTimeoutSeconds: 90 },
  },
};

const RIVALS = ['Rook', 'Mara', 'Vesper'];
const STRATEGIES = ['human', 'leader-hunter', 'tool-hoarder', 'saboteur'];
const PROFILE_KEY = 'plundrix-instant-profile-v1';

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || { name: 'Operator', games: 0, wins: 0, xp: 0, streak: 0 };
  } catch {
    return { name: 'Operator', games: 0, wins: 0, xp: 0, streak: 0 };
  }
}

function createMatch({ mode, gadget, seed, name }) {
  const gadgets = mode === 'tactical'
    ? [gadget, 'firewall', 'signal-scanner', 'precision-kit']
    : [];
  return createInitialSimulation({
    scenarioId: 'human-vs-bots',
    playerCount: 4,
    seed,
    names: [name || 'Operator', ...RIVALS],
    strategies: STRATEGIES,
    gadgets,
    rules: {
      ...MODES[mode].rules,
      sabotageCooldownRounds: 1,
    },
  });
}

function actionPreview(state, action, target) {
  const player = state.players[0];
  if (action === SIM_ACTION.PICK) {
    const bonus = player.gadgetReady && player.gadget === 'precision-kit' ? 10 : 0;
    return `${Math.min(95, getPickChance(player, state.rules) + bonus)}% chance to crack lock ${player.locksCracked + 1}.`;
  }
  if (action === SIM_ACTION.SEARCH) {
    const bonus = player.gadgetReady && player.gadget === 'signal-scanner' ? 20 : 0;
    return `${Math.min(95, getSearchChance(player, state.rules) + bonus)}% chance to gain a tool; each tool adds 15% Pick odds.`;
  }
  const rival = state.players.find((candidate) => candidate.id === target);
  if (!rival) return 'Choose a rival to disrupt.';
  if (rival.lastSabotagedRound && state.currentRound - rival.lastSabotagedRound <= 1) {
    return `${rival.name} has counter-pressure protection this round.`;
  }
  if (rival.gadgetReady && rival.gadget === 'firewall') {
    return `${rival.name}'s Firewall will absorb this Sabotage.`;
  }
  return `Stun ${rival.name} for the next round${rival.tools ? ' and steal one tool' : ''}.`;
}

export default function InstantPlayPage() {
  const [params] = useSearchParams();
  const [profile, setProfile] = useState(readProfile);
  const [mode, setMode] = useState(() => (MODES[params.get('mode')] ? params.get('mode') : 'blitz'));
  const [gadget, setGadget] = useState(() => params.get('gadget') || 'precision-kit');
  const [seed, setSeed] = useState(() => params.get('seed') || `quick-${Date.now()}`);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState(() => createMatch({ mode: 'blitz', gadget, seed, name: profile.name }));
  const [selectedAction, setSelectedAction] = useState(SIM_ACTION.PICK);
  const [target, setTarget] = useState('player-2');
  const [shareStatus, setShareStatus] = useState('');
  const [notifications, setNotifications] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const recordedGame = useRef(null);

  const player = state.players[0];
  const winner = state.players.find((candidate) => candidate.id === state.winner);
  const preview = actionPreview(state, selectedAction, target);
  const lastRound = state.roundHistory.at(-1);
  const latestOutcomes = useMemo(
    () => (lastRound?.events || []).filter((event) => event.type === 'ActionOutcome'),
    [lastRound],
  );

  useEffect(() => {
    if (state.state !== 'COMPLETE' || recordedGame.current === state.gameId) return;
    recordedGame.current = state.gameId;
    setProfile((current) => {
      const won = state.winner === 'player-1';
      const next = {
        ...current,
        games: current.games + 1,
        wins: current.wins + (won ? 1 : 0),
        xp: current.xp + (won ? 125 : 50),
        streak: won ? current.streak + 1 : 0,
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, [state]);

  const begin = (nextSeed = seed) => {
    setSeed(nextSeed);
    setState(createMatch({ mode, gadget, seed: nextSeed, name: profile.name }));
    setSelectedAction(SIM_ACTION.PICK);
    setStarted(true);
    setShareStatus('');
  };

  const resolve = (spectate = false) => {
    const map = buildStrategyActionMap(state, STRATEGIES, {
      aggression: 60,
      searchGreed: 45,
      sabotageThreshold: 58,
      riskTolerance: 60,
    });
    if (!spectate) {
      map['player-1'] = {
        action: selectedAction,
        sabotageTarget: selectedAction === SIM_ACTION.SABOTAGE ? target : null,
      };
    }
    const next = resolveSimulationRound(state, map);
    setState(next);
    setSelectedAction(SIM_ACTION.PICK);
    if (notifications && typeof Notification !== 'undefined' && document.hidden) {
      const nextWinner = next.players.find((candidate) => candidate.id === next.winner);
      new Notification(nextWinner ? `${nextWinner.name} breached the vault` : `Plundrix round ${state.currentRound} resolved`, {
        body: nextWinner ? 'The operation is complete.' : 'Your next decision is ready.',
        icon: '/favicon.svg',
      });
    }
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifications(permission === 'granted');
  };

  const share = async () => {
    const url = `${window.location.origin}/play?mode=${mode}&gadget=${gadget}&seed=${encodeURIComponent(seed)}`;
    if (navigator.share) {
      await navigator.share({ title: 'Challenge my Plundrix vault', text: 'Can you beat this vault setup?', url });
    } else {
      await navigator.clipboard?.writeText(url);
    }
    setShareStatus('Challenge link ready');
  };

  if (!started) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Seo
          title="Play Plundrix Instantly - No Wallet Required"
          description="Start a fast Plundrix vault race against three labeled tactical agents. Choose Pick, Search, or Sabotage with no signup or wallet."
          path="/play"
          image="/images/og/plundrix-play.jpg"
          imageAlt="Plundrix instant play - Your table is ready. No wallet required."
        />
        <section className="overflow-hidden border border-vault-border bg-vault-surface lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-9 lg:p-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxide-green">Instant operation</p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] text-vault-text sm:text-7xl">Your table is ready.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-vault-text-dim">Play immediately against three distinct agents. Learn the pressure loop here, then take the same instincts onchain.</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {Object.entries(MODES).map(([id, item]) => (
                <button key={id} type="button" onClick={() => setMode(id)} className={`min-h-[132px] border p-4 text-left ${mode === id ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-dark/35'}`}>
                  <span className="font-display text-2xl uppercase text-vault-text">{item.label}</span>
                  <span className="mt-3 block text-sm leading-5 text-vault-text-dim">{item.description}</span>
                </button>
              ))}
            </div>

            {mode === 'tactical' && (
              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Choose one gadget</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {SIM_GADGETS.map((item) => (
                    <button key={item.id} type="button" onClick={() => setGadget(item.id)} className={`border p-3 text-left ${gadget === item.id ? 'border-oxide-green bg-oxide-green/10' : 'border-vault-border'}`}>
                      <span className="font-display uppercase text-vault-text">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-vault-text-dim">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={() => begin()} className="mt-8 inline-flex min-h-[54px] items-center bg-tungsten-bright px-7 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-vault-dark">Breach the vault -&gt;</button>
          </div>

          <aside className="relative min-h-[420px] border-t border-vault-border lg:border-l lg:border-t-0">
            <img src="/images/replay-close-finish.webp" alt="Four operators converge on the final vault lock" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-dark via-vault-dark/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Operator record</p>
              <div className="mt-3 grid grid-cols-3 gap-px bg-vault-border">
                <Stat label="Games" value={profile.games} />
                <Stat label="Wins" value={profile.wins} />
                <Stat label="Level" value={Math.floor(profile.xp / 500) + 1} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Seo
        title={`${MODES[mode].label} Operation - Plundrix`}
        description="Play a fast tactical Plundrix vault race against three labeled agents."
        path="/play"
        image="/images/og/plundrix-play.jpg"
        imageAlt="Plundrix instant play - Your table is ready. No wallet required."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <main className="space-y-5">
          <section className="border border-vault-border bg-vault-surface">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-vault-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-oxide-green">{MODES[mode].label} / instant session</p>
                <h1 className="mt-1 font-display text-3xl uppercase text-vault-text">Round {state.currentRound}</h1>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={enableNotifications} className="min-h-[44px] border border-vault-border px-3 font-mono text-[10px] uppercase text-vault-text-dim">{notifications ? 'Alerts on' : 'Turn alerts'}</button>
                <button type="button" onClick={share} className="min-h-[44px] border border-tungsten/45 px-3 font-mono text-[10px] uppercase text-tungsten">Share challenge</button>
              </div>
            </header>

            <div className="grid gap-px bg-vault-border sm:grid-cols-2 lg:grid-cols-4">
              {state.players.map((candidate) => (
                <article key={candidate.id} className={`bg-vault-surface p-4 ${candidate.id === 'player-1' ? 'ring-1 ring-inset ring-tungsten/45' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xl uppercase text-vault-text">{candidate.name}</span>
                    <span className={`h-2 w-2 rounded-full ${candidate.stunned ? 'bg-signal-red' : 'bg-oxide-green'}`} />
                  </div>
                  <div className="mt-4 flex gap-1" role="img" aria-label={`${candidate.locksCracked} of ${state.rules.totalLocks} locks`}>
                    {Array.from({ length: state.rules.totalLocks }, (_, index) => <span key={index} className={`h-8 flex-1 border ${index < candidate.locksCracked ? 'border-tungsten bg-tungsten/25' : 'border-vault-border bg-vault-dark'}`} />)}
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-vault-text-dim">{candidate.tools} tools {candidate.stunned ? '/ stunned' : ''}</p>
                  {candidate.gadget && <p className="mt-1 font-mono text-[9px] uppercase text-oxide-green">{candidate.gadget.replace('-', ' ')} {candidate.gadgetReady ? 'ready' : 'spent'}</p>}
                </article>
              ))}
            </div>
          </section>

          {state.state === 'ACTIVE' ? (
            <section className="border border-vault-border bg-vault-surface p-5 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Commit one concealed action</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  [SIM_ACTION.PICK, 'Pick', `${getPickChance(player, state.rules)}% base`, 'Attack the next lock.'],
                  [SIM_ACTION.SEARCH, 'Search', `${getSearchChance(player, state.rules)}% base`, 'Build future Pick odds.'],
                  [SIM_ACTION.SABOTAGE, 'Sabotage', 'Counterplay protected', 'Stun and steal from a rival.'],
                ].map(([id, label, metric, detail]) => (
                  <button key={id} type="button" aria-pressed={selectedAction === id} onClick={() => setSelectedAction(id)} className={`min-h-[146px] border p-4 text-left ${selectedAction === id ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-dark/35'}`}>
                    <span className="font-display text-3xl uppercase text-vault-text">{label}</span>
                    <span className="mt-2 block font-mono text-[10px] uppercase text-oxide-green">{metric}</span>
                    <span className="mt-3 block text-sm text-vault-text-dim">{detail}</span>
                  </button>
                ))}
              </div>

              {selectedAction === SIM_ACTION.SABOTAGE && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.players.slice(1).map((candidate) => (
                    <button key={candidate.id} type="button" onClick={() => setTarget(candidate.id)} className={`min-h-[44px] border px-4 font-mono text-xs uppercase ${target === candidate.id ? 'border-signal-red bg-signal-red/10 text-signal-red' : 'border-vault-border text-vault-text'}`}>{candidate.name} / {candidate.locksCracked} locks</button>
                  ))}
                </div>
              )}

              <div className="mt-5 border-l-2 border-tungsten bg-vault-dark/50 p-4" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tungsten">Tactical preview</p>
                <p className="mt-2 text-sm leading-6 text-vault-text">{preview}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => resolve(false)} className="min-h-[52px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-vault-dark">Commit and resolve</button>
                <button type="button" onClick={() => resolve(true)} className="min-h-[52px] border border-vault-border px-5 font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">Let the agent play this turn</button>
              </div>
            </section>
          ) : (
            <section className="border border-tungsten/45 bg-tungsten/10 p-7 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-tungsten">Final briefing</p>
              <h2 className="mt-3 font-display text-5xl uppercase text-vault-text">{winner?.name} breached the vault</h2>
              <p className="mt-3 text-vault-text-dim">Completed in {state.currentRound} rounds. {state.winner === 'player-1' ? 'You earned 125 XP.' : 'You earned 50 XP.'}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => begin(`rematch-${Date.now()}`)} className="min-h-[50px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase text-vault-dark">Instant rematch</button>
                <button type="button" onClick={share} className="min-h-[50px] border border-tungsten/45 px-5 font-mono text-xs uppercase text-tungsten">Share this setup</button>
                <Link to="/replays" className="inline-flex min-h-[50px] items-center border border-vault-border px-5 font-mono text-xs uppercase text-vault-text">Watch replays</Link>
              </div>
            </section>
          )}

          {latestOutcomes.length > 0 && (
            <section className="border border-vault-border bg-vault-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-vault-text-dim">Last resolution</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {latestOutcomes.map((event) => <p key={event.id} className="border border-vault-border bg-vault-dark/50 px-3 py-2 text-sm text-vault-text">{event.message}</p>)}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-oxide-green">First-operation guide</p>
            <ol className="mt-4 space-y-3">
              {[
                ['Choose', state.roundHistory.length > 0, 'Read the odds and commit one move.'],
                ['Resolve', state.roundHistory.length > 0, 'Every operator reveals together.'],
                ['Counter', state.roundHistory.length > 1, 'React to tools, stuns, and leaders.'],
                ['Breach', state.state === 'COMPLETE', 'Crack the final lock first.'],
              ].map(([label, done, detail], index) => (
                <li key={label} className="flex gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center border font-mono text-[10px] ${done ? 'border-oxide-green bg-oxide-green/10 text-oxide-green' : 'border-vault-border text-vault-text-dim'}`}>{done ? 'OK' : index + 1}</span>
                  <div><p className="font-display uppercase text-vault-text">{label}</p><p className="mt-1 text-xs leading-5 text-vault-text-dim">{detail}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Season identity</p>
            <label className="mt-4 grid gap-2">
              <span className="font-mono text-[10px] uppercase text-vault-text-dim">Operator name</span>
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value.slice(0, 20) }))} onBlur={() => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))} className="min-h-[44px] border border-vault-border bg-vault-dark px-3 text-vault-text" />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="XP" value={profile.xp} />
              <Stat label="Streak" value={profile.streak} />
              <Stat label="Wins" value={profile.wins} />
              <Stat label="Games" value={profile.games} />
            </div>
            <div className="mt-3 h-2 bg-vault-dark"><div className="h-2 bg-oxide-green" style={{ width: `${(profile.xp % 500) / 5}%` }} /></div>
            <p className="mt-2 font-mono text-[9px] uppercase text-vault-text-dim">Level {Math.floor(profile.xp / 500) + 1} / next rank in {500 - (profile.xp % 500)} XP</p>
          </section>

          <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Next operation</p>
            <div className="mt-3 grid gap-2">
              <Link to="/#live-operations" className="min-h-[44px] border border-tungsten/45 px-3 py-3 font-mono text-[10px] uppercase text-tungsten">Take it onchain</Link>
              <Link to="/trailer" className="min-h-[44px] border border-vault-border px-3 py-3 font-mono text-[10px] uppercase text-vault-text">Watch gameplay trailer</Link>
              <Link to="/sessions" className="min-h-[44px] border border-vault-border px-3 py-3 font-mono text-[10px] uppercase text-vault-text">Spectate live sessions</Link>
            </div>
            {shareStatus && <p className="mt-3 font-mono text-[10px] uppercase text-oxide-green">{shareStatus}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-vault-dark/75 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-vault-text-dim">{label}</p>
      <p className="mt-1 font-display text-2xl text-vault-text">{value}</p>
    </div>
  );
}
