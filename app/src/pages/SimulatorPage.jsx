import { useMemo, useRef, useState } from 'react';
import {
  AUTOPILOT_BUDGETS,
  OBJECTIVE_PRESETS,
  exportAutopilotCsv,
  exportAutopilotJson,
  exportAutopilotMarkdown,
  importExperimentJson,
  listExperiments,
  loadExperiment,
  saveExperiment,
} from '../lib/balanceAutopilot';
import {
  buildPairedReplayComparison,
  buildReplayFromSimulation,
  buildReplayFromSeed,
  buildReplaysFromAutopilot,
  buildReplaysFromBatch,
  exportReplayCsv,
  exportReplayJson,
  exportReplayMarkdown,
  saveReplayToLibrary,
} from '../lib/replayDirector';
import {
  SIM_ACTION,
  SIM_ACTION_LABEL,
  SIM_DEFAULT_RULES,
  SIM_DEFAULT_STRATEGY_PROFILE,
  SIM_MAX_PLAYERS,
  SIM_MIN_PLAYERS,
  SIM_SCENARIOS,
  SIM_STRATEGIES,
  buildFunCurve,
  buildReplayConfig,
  buildStrategyActionMap,
  compareRulesets,
  createInitialSimulation,
  exportBatchCsv,
  getContractParityChecks,
  getPickChance,
  getScenarioConfig,
  getScenarioOptions,
  getSearchChance,
  normalizeRuleset,
  normalizeStrategyProfile,
  parseReplayConfig,
  recommendAction,
  resolveSimulationRound,
  runBatch,
  runSimulation,
  runWhatIf,
  summarizeSimulation,
} from '../lib/plundrixEngine';

const replayConfig =
  typeof window === 'undefined' ? {} : parseReplayConfig(window.location.search);
const DEFAULT_STRATEGIES = replayConfig.strategies || ['balanced', 'picker', 'searcher', 'saboteur'];
const DEFAULT_SCENARIO = replayConfig.scenarioId || 'new-player-table';

function makeDefaultActions(state) {
  return Object.fromEntries(
    state.players.map((player, index) => [
      player.id,
      {
        action: index === 3 ? SIM_ACTION.SABOTAGE : SIM_ACTION.PICK,
        sabotageTarget: state.players.find((target) => target.id !== player.id)?.id || null,
      },
    ]),
  );
}

function formatPercent(value, total = 1) {
  if (!total) {
    return '0.0%';
  }
  return `${((value / total) * 100).toFixed(1)}%`;
}

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SimulatorPage() {
  const scenarioOptions = getScenarioOptions(DEFAULT_SCENARIO);
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO);
  const [playerCount, setPlayerCount] = useState(
    replayConfig.playerCount || scenarioOptions.playerCount || 4,
  );
  const [seed, setSeed] = useState(replayConfig.seed || scenarioOptions.seed || 'plundrix-lab');
  const [batchGames, setBatchGames] = useState(250);
  const [maxRounds, setMaxRounds] = useState(40);
  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES);
  const [strategyProfile, setStrategyProfile] = useState(
    normalizeStrategyProfile(scenarioOptions.strategyProfile || SIM_DEFAULT_STRATEGY_PROFILE),
  );
  const [rules, setRules] = useState(normalizeRuleset(replayConfig.rules || SIM_DEFAULT_RULES));
  const [simState, setSimState] = useState(() =>
    createInitialSimulation({
      scenarioId: DEFAULT_SCENARIO,
      playerCount: replayConfig.playerCount || scenarioOptions.playerCount || 4,
      seed: replayConfig.seed || scenarioOptions.seed || 'plundrix-lab',
      rules: replayConfig.rules || SIM_DEFAULT_RULES,
    }),
  );
  const [manualActions, setManualActions] = useState(() => makeDefaultActions(simState));
  const [batchResult, setBatchResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [playbackRound, setPlaybackRound] = useState(0);
  const [whatIfPlayer, setWhatIfPlayer] = useState('player-1');
  const [replayLink, setReplayLink] = useState('');
  const [exportPreview, setExportPreview] = useState('');
  const [autopilotReport, setAutopilotReport] = useState(null);
  const [autopilotProgress, setAutopilotProgress] = useState(null);
  const [autopilotError, setAutopilotError] = useState('');
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autopilotConfig, setAutopilotConfig] = useState({
    mode: 'random',
    budget: 'smoke',
    objective: 'default',
    iterations: 6,
    games: 10,
    lockedKeys: [],
    tuningMode: 'future-contract',
  });
  const [seedResults, setSeedResults] = useState([]);
  const [savedExperiments, setSavedExperiments] = useState(() => listExperiments());
  const [directedReplays, setDirectedReplays] = useState([]);
  const [pairedReplay, setPairedReplay] = useState(null);
  const autopilotWorkerRef = useRef(null);

  const summary = useMemo(() => summarizeSimulation(simState), [simState]);
  const latestEvents = useMemo(() => simState.events.slice(-18).reverse(), [simState.events]);
  const funCurve = useMemo(() => buildFunCurve(simState), [simState]);
  const parityChecks = useMemo(() => getContractParityChecks(rules), [rules]);
  const recommendations = useMemo(
    () => simState.players.map((player) => recommendAction(simState, player.id)).filter(Boolean),
    [simState],
  );
  const whatIf = useMemo(() => {
    const action = manualActions[whatIfPlayer];
    return action ? runWhatIf(simState, whatIfPlayer, action) : null;
  }, [manualActions, simState, whatIfPlayer]);
  const winner = simState.players.find((player) => player.id === simState.winner);
  const playbackPlayers =
    playbackRound > 0
      ? simState.roundHistory[playbackRound - 1]?.players || simState.players
      : simState.players;

  const resetSimulation = (overrides = {}) => {
    const next = createInitialSimulation({
      scenarioId,
      playerCount,
      seed,
      rules,
      ...overrides,
    });
    setSimState(next);
    setManualActions(makeDefaultActions(next));
    setPlaybackRound(0);
  };

  const applyScenario = (nextScenarioId) => {
    const next = getScenarioConfig(nextScenarioId);
    const options = getScenarioOptions(nextScenarioId);
    const nextRules = normalizeRuleset(SIM_DEFAULT_RULES);
    const nextProfile = normalizeStrategyProfile(options.strategyProfile || SIM_DEFAULT_STRATEGY_PROFILE);

    setScenarioId(next.id);
    setPlayerCount(options.playerCount);
    setSeed(options.seed);
    setStrategies(options.strategies);
    setStrategyProfile(nextProfile);
    setRules(nextRules);

    const initial = createInitialSimulation({
      scenarioId: next.id,
      playerCount: options.playerCount,
      seed: options.seed,
      rules: nextRules,
    });
    setSimState(initial);
    setManualActions(makeDefaultActions(initial));
    setBatchResult(null);
    setComparisonResult(null);
    setPlaybackRound(0);
  };

  const updateStrategy = (index, value) => {
    setStrategies((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const updateAction = (playerId, patch) => {
    setManualActions((current) => ({
      ...current,
      [playerId]: {
        ...current[playerId],
        ...patch,
      },
    }));
  };

  const resolveManualRound = () => {
    const next = resolveSimulationRound(simState, manualActions);
    setSimState(next);
    setManualActions(makeDefaultActions(next));
    setPlaybackRound(0);
  };

  const resolveStrategyRound = () => {
    const actionMap = buildStrategyActionMap(simState, strategies, strategyProfile);
    const next = resolveSimulationRound(simState, actionMap);
    setSimState(next);
    setManualActions(makeDefaultActions(next));
    setPlaybackRound(0);
  };

  const runSingleGame = () => {
    const next = runSimulation({
      scenarioId,
      playerCount,
      seed,
      strategies,
      strategyProfile,
      rules,
      maxRounds,
    });
    setSimState(next);
    setManualActions(makeDefaultActions(next));
    setPlaybackRound(0);
  };

  const runBatchGames = () => {
    const result = runBatch({
      games: batchGames,
      scenarioId,
      playerCount,
      seed,
      strategies,
      strategyProfile,
      rules,
      maxRounds,
    });
    setBatchResult(result);
    setExportPreview(JSON.stringify(result.dashboard, null, 2));
  };

  const runComparison = () => {
    setComparisonResult(
      compareRulesets({
        games: batchGames,
        scenarioId,
        playerCount,
        seed,
        strategies,
        strategyProfile,
        baselineRules: SIM_DEFAULT_RULES,
        candidateRules: rules,
        maxRounds,
      }),
    );
  };

  const createReplayLink = async () => {
    const query = buildReplayConfig({
      seed,
      playerCount,
      scenarioId,
      strategies,
      rules,
    });
    const next = `${window.location.origin}${window.location.pathname}?${query}`;
    window.history.replaceState(null, '', next);
    setReplayLink(next);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(next);
    }
  };

  const stopAutopilot = () => {
    autopilotWorkerRef.current?.terminate();
    autopilotWorkerRef.current = null;
    setAutopilotRunning(false);
    setAutopilotProgress((current) => current ? { ...current, stopped: true } : { stopped: true });
  };

  const startAutopilot = () => {
    stopAutopilot();
    const worker = new Worker(new URL('../workers/balanceAutopilot.worker.js', import.meta.url), {
      type: 'module',
    });
    autopilotWorkerRef.current = worker;
    setAutopilotRunning(true);
    setAutopilotError('');
    setAutopilotProgress({ completed: 0, total: autopilotConfig.iterations });
    worker.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'progress') {
        setAutopilotProgress(payload);
      } else if (type === 'complete') {
        setAutopilotReport(payload);
        setExportPreview(exportAutopilotMarkdown(payload));
        setAutopilotRunning(false);
        worker.terminate();
        autopilotWorkerRef.current = null;
      } else if (type === 'seeds') {
        setSeedResults(payload);
        setAutopilotRunning(false);
        worker.terminate();
        autopilotWorkerRef.current = null;
      } else if (type === 'error') {
        setAutopilotError(payload);
        setAutopilotRunning(false);
        worker.terminate();
        autopilotWorkerRef.current = null;
      }
    };
    worker.postMessage({
      type: 'start',
      payload: {
        ...autopilotConfig,
        seed,
        scenarios: [scenarioId, 'new-player-table', 'comeback-test', 'stall-test'],
        strategies,
        strategyProfile,
        baselineRules: SIM_DEFAULT_RULES,
        bounds: {
          totalLocks: [4, 7],
          maxTools: [3, 6],
          pickBaseChance: [25, 50],
          pickToolBonus: [10, 25],
          pickChanceCap: [80, 98],
          searchChance: [45, 75],
          stunnedSearchChance: [15, 45],
        },
        rules,
        maxRounds,
        topN: 8,
      },
    });
  };

  const findAutopilotSeeds = (kind) => {
    stopAutopilot();
    const worker = new Worker(new URL('../workers/balanceAutopilot.worker.js', import.meta.url), {
      type: 'module',
    });
    autopilotWorkerRef.current = worker;
    setAutopilotRunning(true);
    setAutopilotError('');
    worker.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'seeds') {
        setSeedResults(payload);
        setAutopilotRunning(false);
        worker.terminate();
        autopilotWorkerRef.current = null;
      } else if (type === 'error') {
        setAutopilotError(payload);
        setAutopilotRunning(false);
        worker.terminate();
        autopilotWorkerRef.current = null;
      }
    };
    worker.postMessage({
      type: 'find-seeds',
      payload: {
        kind,
        seed,
        iterations: 40,
        limit: 8,
        scenarios: [scenarioId, 'new-player-table', 'comeback-test', 'stall-test'],
        strategies,
        strategyProfile,
        rules,
      },
    });
  };

  const applyAutopilotCandidate = (candidate) => {
    setRules(candidate.rules);
    setComparisonResult(
      compareRulesets({
        games: batchGames,
        scenarioId,
        playerCount,
        seed,
        strategies,
        strategyProfile,
        baselineRules: SIM_DEFAULT_RULES,
        candidateRules: candidate.rules,
        maxRounds,
      }),
    );
  };

  const saveCurrentAutopilotExperiment = () => {
    if (!autopilotReport) return;
    const name = `experiment-${new Date().toISOString().replaceAll(':', '-')}`;
    saveExperiment(name, autopilotReport);
    setSavedExperiments(listExperiments());
  };

  const loadAutopilotExperiment = (name) => {
    const report = loadExperiment(name);
    if (report) {
      setAutopilotReport(report);
      setExportPreview(exportAutopilotMarkdown(report));
    }
  };

  const importAutopilotExperiment = (text) => {
    const report = importExperimentJson(text);
    setAutopilotReport(report);
    setExportPreview(exportAutopilotMarkdown(report));
  };

  const directCurrentGame = () => {
    const replay = buildReplayFromSimulation(simState, { strategies, maxRounds });
    setDirectedReplays((current) => [replay, ...current.filter((item) => item.id !== replay.id)].slice(0, 8));
    setExportPreview(exportReplayMarkdown(replay));
  };

  const directBatchReplays = () => {
    const result = batchResult || runBatch({
      games: Math.min(batchGames, 20),
      scenarioId,
      playerCount,
      seed,
      strategies,
      strategyProfile,
      rules,
      maxRounds,
      includeStates: true,
    });
    const replays = buildReplaysFromBatch(result, { limit: 8, scenarioId, maxRounds });
    setDirectedReplays(replays);
    setExportPreview(exportReplayCsv(replays));
  };

  const directAutopilotReplays = () => {
    if (!autopilotReport) return;
    const replays = buildReplaysFromAutopilot(autopilotReport, { limit: 8 });
    setDirectedReplays(replays);
    setExportPreview(exportReplayMarkdown(replays[0]));
  };

  const buildPairedReplay = () => {
    const candidate = autopilotReport?.topCandidates?.[0];
    const paired = buildPairedReplayComparison({
      seed,
      scenarioId,
      strategies,
      baselineRules: SIM_DEFAULT_RULES,
      candidateRules: candidate?.rules || rules,
      maxRounds,
      games: 8,
    });
    setPairedReplay(paired);
    setDirectedReplays([paired.tuned, paired.baseline]);
    setExportPreview(exportReplayMarkdown(paired.tuned));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxide-green">
                Gameplay simulator
              </p>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl text-vault-text">
                Tuning Lab
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
                Run contract-parity defaults, tune rules safely, compare batches, replay seeds,
                and inspect player outcomes without leaving the game engine.
              </p>
            </div>
            <div className="rounded border border-vault-border bg-vault-panel/70 px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">
              Round {simState.currentRound}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1">
              <span className="label">Scenario</span>
              <select
                value={scenarioId}
                onChange={(event) => applyScenario(event.target.value)}
                className="control"
              >
                {SIM_SCENARIOS.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Players</span>
              <select
                value={playerCount}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setPlayerCount(value);
                  resetSimulation({ playerCount: value });
                }}
                className="control"
              >
                {Array.from({ length: SIM_MAX_PLAYERS - SIM_MIN_PLAYERS + 1 }, (_, index) => (
                  <option key={index} value={SIM_MIN_PLAYERS + index}>
                    {SIM_MIN_PLAYERS + index}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Seed</span>
              <input value={seed} onChange={(event) => setSeed(event.target.value)} className="control" />
            </label>
            <label className="grid gap-1">
              <span className="label">Max rounds</span>
              <input
                type="number"
                min="1"
                max="500"
                value={maxRounds}
                onChange={(event) => setMaxRounds(Number(event.target.value))}
                className="control"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <LabButton onClick={() => resetSimulation()}>Reset</LabButton>
            <LabButton tone="primary" onClick={resolveManualRound} disabled={simState.state !== 'ACTIVE'}>
              Manual round
            </LabButton>
            <LabButton tone="gold" onClick={resolveStrategyRound} disabled={simState.state !== 'ACTIVE'}>
              Strategy round
            </LabButton>
            <LabButton onClick={runSingleGame}>Run one game</LabButton>
            <LabButton tone="green" onClick={runBatchGames}>Run batch</LabButton>
            <LabButton tone="green" onClick={runComparison}>Compare rules</LabButton>
            <LabButton onClick={createReplayLink}>Replay link</LabButton>
          </div>

          {replayLink && (
            <p className="mt-3 break-all rounded border border-vault-border bg-vault-panel/55 px-3 py-2 font-mono text-[11px] text-vault-text-dim">
              {replayLink}
            </p>
          )}
        </div>

        <div className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
          <p className="label">Outcome</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="Winner" value={winner?.name || 'None'} />
            <Metric label="Rounds" value={summary.rounds} />
            <Metric label="Picks" value={`${summary.pickSuccesses}/${summary.picks}`} />
            <Metric label="Searches" value={`${summary.searchSuccesses}/${summary.searches}`} />
            <Metric label="Sabotage" value={`${summary.sabotageSuccesses}/${summary.sabotages}`} />
            <Metric label="Tension" value={summary.averageTension.toFixed(0)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TuningPanel
          batchGames={batchGames}
          setBatchGames={setBatchGames}
          rules={rules}
          setRules={setRules}
          strategyProfile={strategyProfile}
          setStrategyProfile={setStrategyProfile}
          parityChecks={parityChecks}
        />

        <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Player controls</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
              Manual plus bot strategies
            </span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {simState.players.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                players={simState.players}
                rules={simState.rules}
                strategy={strategies[index] || 'balanced'}
                action={manualActions[player.id] || {}}
                recommendation={recommendations.find((item) => item.playerId === player.id)}
                onStrategyChange={(value) => updateStrategy(index, value)}
                onActionChange={(patch) => updateAction(player.id, patch)}
                onWhatIf={() => setWhatIfPlayer(player.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <BatchPanel
          result={batchResult}
          players={simState.players}
          onExportJson={() =>
            batchResult &&
            downloadText('plundrix-simulator-report.json', JSON.stringify(batchResult, null, 2), 'application/json')
          }
          onExportCsv={() =>
            batchResult && downloadText('plundrix-simulator-report.csv', exportBatchCsv(batchResult), 'text/csv')
          }
        />
        <ComparisonPanel result={comparisonResult} />
      </section>

      <ReplayDirectorPanel
        replays={directedReplays}
        pairedReplay={pairedReplay}
        onDirectCurrent={directCurrentGame}
        onDirectBatch={directBatchReplays}
        onDirectAutopilot={directAutopilotReplays}
        onBuildPaired={buildPairedReplay}
        hasAutopilot={Boolean(autopilotReport)}
      />

      <BalanceAutopilotPanel
        config={autopilotConfig}
        setConfig={setAutopilotConfig}
        report={autopilotReport}
        progress={autopilotProgress}
        error={autopilotError}
        running={autopilotRunning}
        seedResults={seedResults}
        savedExperiments={savedExperiments}
        onStart={startAutopilot}
        onStop={stopAutopilot}
        onFindSeeds={findAutopilotSeeds}
        onApplyCandidate={applyAutopilotCandidate}
        onSaveExperiment={saveCurrentAutopilotExperiment}
        onLoadExperiment={loadAutopilotExperiment}
        onImportExperiment={importAutopilotExperiment}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PlaybackPanel
          simState={simState}
          playbackRound={playbackRound}
          setPlaybackRound={setPlaybackRound}
          players={playbackPlayers}
          funCurve={funCurve}
        />
        <WhatIfPanel
          players={simState.players}
          whatIfPlayer={whatIfPlayer}
          setWhatIfPlayer={setWhatIfPlayer}
          whatIf={whatIf}
          action={manualActions[whatIfPlayer]}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <EventLog events={latestEvents} />
        <ExportPreview value={exportPreview} setValue={setExportPreview} />
      </section>
    </div>
  );
}

function LabButton({ children, onClick, disabled, tone = 'default' }) {
  const tones = {
    default: 'border-vault-border text-vault-text hover:bg-vault-panel',
    primary: 'border-tungsten bg-tungsten text-vault-dark',
    gold: 'border-tungsten/55 text-tungsten hover:bg-tungsten/10',
    green: 'border-oxide-green/45 text-oxide-green hover:bg-oxide-green/10',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] rounded border px-4 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
      <div className="label">{label}</div>
      <div className="mt-2 truncate font-display text-lg text-vault-text">{value}</div>
    </div>
  );
}

function TuningPanel({
  batchGames,
  setBatchGames,
  rules,
  setRules,
  strategyProfile,
  setStrategyProfile,
  parityChecks,
}) {
  const updateRule = (key, value) => setRules((current) => normalizeRuleset({ ...current, [key]: value }));
  const updateProfile = (key, value) =>
    setStrategyProfile((current) => normalizeStrategyProfile({ ...current, [key]: value }));
  const parityPass = parityChecks.every((check) => check.pass);

  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">Rules and strategies</p>
        <span
          className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
            parityPass
              ? 'border-oxide-green/35 bg-oxide-green/10 text-oxide-green'
              : 'border-tungsten/45 bg-tungsten/10 text-tungsten'
          }`}
        >
          {parityPass ? 'Contract parity' : 'Tuned rules'}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="label">Batch games</span>
          <input
            type="number"
            min="1"
            max="10000"
            value={batchGames}
            onChange={(event) => setBatchGames(Number(event.target.value))}
            className="control"
          />
        </label>
        <label className="grid gap-1">
          <span className="label">Total locks</span>
          <input
            type="number"
            min="3"
            max="9"
            value={rules.totalLocks}
            onChange={(event) => updateRule('totalLocks', event.target.value)}
            className="control"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SliderInput label="Pick base" value={rules.pickBaseChance} onChange={(value) => updateRule('pickBaseChance', value)} />
        <SliderInput label="Tool bonus" value={rules.pickToolBonus} max={50} onChange={(value) => updateRule('pickToolBonus', value)} />
        <SliderInput label="Pick cap" value={rules.pickChanceCap} min={5} max={99} onChange={(value) => updateRule('pickChanceCap', value)} />
        <SliderInput label="Search" value={rules.searchChance} onChange={(value) => updateRule('searchChance', value)} />
        <SliderInput label="Stunned search" value={rules.stunnedSearchChance} onChange={(value) => updateRule('stunnedSearchChance', value)} />
        <SliderInput label="Max tools" value={rules.maxTools} min={1} max={9} onChange={(value) => updateRule('maxTools', value)} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SliderInput label="Aggression" value={strategyProfile.aggression} onChange={(value) => updateProfile('aggression', value)} />
        <SliderInput label="Search greed" value={strategyProfile.searchGreed} onChange={(value) => updateProfile('searchGreed', value)} />
        <SliderInput label="Sabotage threshold" value={strategyProfile.sabotageThreshold} onChange={(value) => updateProfile('sabotageThreshold', value)} />
        <SliderInput label="Risk tolerance" value={strategyProfile.riskTolerance} onChange={(value) => updateProfile('riskTolerance', value)} />
      </div>

      <div className="mt-4 grid gap-2">
        {parityChecks.map((check) => (
          <div key={check.key} className="flex items-center justify-between rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
              {check.key}
            </span>
            <span className={check.pass ? 'text-oxide-green' : 'text-tungsten'}>
              {check.actual} / {check.expected}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SliderInput({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between gap-3">
        <span className="label">{label}</span>
        <span className="font-mono text-xs text-vault-text">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 accent-oxide-green"
      />
    </label>
  );
}

function PlayerCard({
  player,
  players,
  rules,
  strategy,
  action,
  recommendation,
  onStrategyChange,
  onActionChange,
  onWhatIf,
}) {
  const targetOptions = players.filter((target) => target.id !== player.id);
  const lockPercent = (player.locksCracked / rules.totalLocks) * 100;

  return (
    <article className="rounded border border-vault-border bg-vault-panel/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-vault-text">{player.name}</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-vault-text-dim">
            {player.address.slice(0, 6)}...{player.address.slice(-4)}
          </p>
        </div>
        <span
          className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
            player.stunned
              ? 'border-alert-red/45 bg-alert-red/10 text-alert-red'
              : 'border-oxide-green/35 bg-oxide-green/10 text-oxide-green'
          }`}
        >
          {player.stunned ? 'Stunned' : 'Ready'}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
          <span>Locks</span>
          <span>
            {player.locksCracked}/{rules.totalLocks}
          </span>
        </div>
        <div className="mt-2 h-2 rounded bg-vault-dark">
          <div className="h-2 rounded bg-tungsten" style={{ width: `${lockPercent}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Tools" value={player.tools} />
        <Metric label="Pick" value={`${getPickChance(player, rules)}%`} />
        <Metric label="Search" value={`${getSearchChance(player, rules)}%`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="label">AI</span>
          <select value={strategy} onChange={(event) => onStrategyChange(event.target.value)} className="control">
            {SIM_STRATEGIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="label">Action</span>
          <select
            value={action.action ?? SIM_ACTION.PICK}
            onChange={(event) => onActionChange({ action: Number(event.target.value) })}
            className="control"
          >
            {[SIM_ACTION.PICK, SIM_ACTION.SEARCH, SIM_ACTION.SABOTAGE].map((item) => (
              <option key={item} value={item}>
                {SIM_ACTION_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="label">Target</span>
          <select
            value={action.sabotageTarget || targetOptions[0]?.id || ''}
            onChange={(event) => onActionChange({ sabotageTarget: event.target.value })}
            className="control"
          >
            {targetOptions.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {recommendation && (
        <button
          type="button"
          onClick={onWhatIf}
          className="mt-3 w-full rounded border border-vault-border bg-vault-dark px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-panel"
        >
          <span className="label">Recommended</span>
          <span className="ml-2 font-mono text-xs text-oxide-green">
            {recommendation.best.label}
            {recommendation.targetName ? ` -> ${recommendation.targetName}` : ''}
          </span>
        </button>
      )}
    </article>
  );
}

function BatchPanel({ result, players, onExportJson, onExportCsv }) {
  if (!result) {
    return (
      <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Batch scorecard</p>
        <p className="mt-3 text-sm text-vault-text-dim">
          Run a batch to get win spread, duration health, comeback rate, runaway rate, action value, and balance warnings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">Batch scorecard</p>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
          Grade {result.scorecard.grade}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Score" value={result.scorecard.score.toFixed(0)} />
        <Metric label="Avg rounds" value={result.scorecard.averageRounds.toFixed(2)} />
        <Metric label="Comeback" value={formatPercent(result.scorecard.comebackRate)} />
        <Metric label="Runaway" value={formatPercent(result.scorecard.runawayRate)} />
      </div>
      <div className="mt-3 space-y-2">
        {players.map((player) => {
          const wins = result.winCounts[player.id] || 0;
          return (
            <div key={player.id} className="rounded border border-vault-border bg-vault-panel/55 p-3">
              <div className="flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.13em] text-vault-text">
                <span>{player.name}</span>
                <span>{formatPercent(wins, result.games)}</span>
              </div>
              <div className="mt-2 h-2 rounded bg-vault-dark">
                <div className="h-2 rounded bg-oxide-green" style={{ width: formatPercent(wins, result.games) }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2">
        {result.dashboard.flags.map((flag) => (
          <p key={flag} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2 text-sm text-vault-text-dim">
            {flag}
          </p>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Pick EV" value={result.actionValue.pick.toFixed(2)} />
        <Metric label="Search EV" value={result.actionValue.search.toFixed(2)} />
        <Metric label="Sabotage EV" value={result.actionValue.sabotage.toFixed(2)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <LabButton onClick={onExportJson}>Export JSON</LabButton>
        <LabButton onClick={onExportCsv}>Export CSV</LabButton>
      </div>
    </div>
  );
}

function ComparisonPanel({ result }) {
  if (!result) {
    return (
      <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
        <p className="label">Rules comparison</p>
        <p className="mt-3 text-sm text-vault-text-dim">
          Compare contract defaults against the tuned rules with the same seed, strategies, and batch size.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <p className="label">Rules comparison</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric label="Base score" value={result.baseline.scorecard.score.toFixed(0)} />
        <Metric label="Tuned score" value={result.candidate.scorecard.score.toFixed(0)} />
        <Metric label="Round delta" value={result.deltas.averageRounds.toFixed(2)} />
        <Metric label="Spread delta" value={formatPercent(result.deltas.winSpread)} />
        <Metric label="Runaway delta" value={formatPercent(result.deltas.runawayRate)} />
        <Metric label="Comeback delta" value={formatPercent(result.deltas.comebackRate)} />
      </div>
    </div>
  );
}

function ReplayDirectorPanel({
  replays,
  pairedReplay,
  onDirectCurrent,
  onDirectBatch,
  onDirectAutopilot,
  onBuildPaired,
  hasAutopilot,
}) {
  return (
    <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label">Replay Director</p>
          <h2 className="mt-2 font-display text-2xl text-vault-text">Turn outcomes into playable proof</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
            Direct this simulation into a replay story, rank dramatic batch results, build before/after tuning comparisons, and send strong clips to the gallery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LabButton onClick={onDirectCurrent}>Direct this game</LabButton>
          <LabButton onClick={onDirectBatch}>Best from batch</LabButton>
          <LabButton onClick={onDirectAutopilot} disabled={!hasAutopilot}>From Autopilot</LabButton>
          <LabButton onClick={onBuildPaired}>Paired replay</LabButton>
        </div>
      </div>

      {pairedReplay && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Baseline" value={pairedReplay.baseline.dramaticScore.toFixed(1)} />
          <Metric label="Tuned" value={pairedReplay.tuned.dramaticScore.toFixed(1)} />
          <Metric label="Delta" value={pairedReplay.scoreDelta.toFixed(1)} />
          <Metric label="Changed rounds" value={pairedReplay.timelineComparison.filter((item) => item.changed).length} />
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {replays.map((replay) => (
          <article key={replay.id} className="rounded border border-vault-border bg-vault-panel/55 p-3">
            <p className="label">Score {replay.dramaticScore.toFixed(1)}</p>
            <h3 className="mt-2 font-display text-lg text-vault-text">{replay.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-vault-text-dim">{replay.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={replay.shareUrl} className="min-h-[44px] rounded border border-tungsten/55 px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">
                Open
              </a>
              <button type="button" onClick={() => saveReplayToLibrary(replay)} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                Send to gallery
              </button>
              <button type="button" onClick={() => downloadText(`${replay.id}.json`, exportReplayJson(replay), 'application/json')} className="min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                JSON
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BalanceAutopilotPanel({
  config,
  setConfig,
  report,
  progress,
  error,
  running,
  seedResults,
  savedExperiments,
  onStart,
  onStop,
  onFindSeeds,
  onApplyCandidate,
  onSaveExperiment,
  onLoadExperiment,
  onImportExperiment,
}) {
  const [candidateNotes, setCandidateNotes] = useState({});
  const [pinnedCandidateIds, setPinnedCandidateIds] = useState([]);
  const [importText, setImportText] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const keys = [
    'totalLocks',
    'maxTools',
    'pickBaseChance',
    'pickToolBonus',
    'pickChanceCap',
    'searchChance',
    'stunnedSearchChance',
  ];
  const selectedCandidate =
    report?.topCandidates.find((candidate) => candidate.id === selectedCandidateId) ||
    report?.topCandidates[0] ||
    null;
  const percentComplete = progress?.total
    ? Math.min(100, (progress.completed / progress.total) * 100)
    : 0;

  const updateConfig = (patch) => setConfig((current) => ({ ...current, ...patch }));
  const toggleLock = (key) => {
    setConfig((current) => {
      const set = new Set(current.lockedKeys || []);
      if (set.has(key)) {
        set.delete(key);
      } else {
        set.add(key);
      }
      return { ...current, lockedKeys: [...set] };
    });
  };
  const togglePin = (id) => {
    setPinnedCandidateIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <section className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label">Balance Autopilot</p>
          <h2 className="mt-2 font-display text-2xl text-vault-text">
            Auto-balance discovery
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
            Searches rulesets, reranks candidates, validates the best ones, finds interesting seeds,
            and explains implementation cost before anything becomes a contract change.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LabButton tone="green" onClick={onStart} disabled={running}>Start</LabButton>
          <LabButton onClick={onStop} disabled={!running}>Stop</LabButton>
          <LabButton onClick={() => onFindSeeds('exciting')} disabled={running}>Exciting seeds</LabButton>
          <LabButton onClick={() => onFindSeeds('broken')} disabled={running}>Broken seeds</LabButton>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label">Mode</span>
              <select value={config.mode} onChange={(event) => updateConfig({ mode: event.target.value })} className="control">
                {['random', 'hill', 'beam', 'grid'].map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Budget</span>
              <select value={config.budget} onChange={(event) => updateConfig({ budget: event.target.value })} className="control">
                {Object.keys(AUTOPILOT_BUDGETS).map((budget) => (
                  <option key={budget} value={budget}>{budget}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Objective</span>
              <select value={config.objective} onChange={(event) => updateConfig({ objective: event.target.value })} className="control">
                {Object.values(OBJECTIVE_PRESETS).map((objective) => (
                  <option key={objective.id} value={objective.id}>{objective.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Tuning mode</span>
              <select value={config.tuningMode} onChange={(event) => updateConfig({ tuningMode: event.target.value })} className="control">
                <option value="contract-compatible-now">contract-compatible-now</option>
                <option value="soft-tuning">soft-tuning</option>
                <option value="hard-tuning">hard-tuning</option>
                <option value="future-contract">future-contract</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Iterations</span>
              <input
                type="number"
                min="1"
                max="400"
                value={config.iterations}
                onChange={(event) => updateConfig({ iterations: Number(event.target.value) })}
                className="control"
              />
            </label>
            <label className="grid gap-1">
              <span className="label">Games per candidate</span>
              <input
                type="number"
                min="1"
                max="500"
                value={config.games}
                onChange={(event) => updateConfig({ games: Number(event.target.value) })}
                className="control"
              />
            </label>
          </div>

          <div>
            <p className="label">Locked knobs</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {keys.map((key) => {
                const locked = config.lockedKeys?.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleLock(key)}
                    className={`rounded border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] ${
                      locked
                        ? 'border-tungsten/55 bg-tungsten/10 text-tungsten'
                        : 'border-vault-border text-vault-text-dim hover:text-vault-text'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="label">Progress</span>
              <span className="font-mono text-xs text-vault-text-dim">
                {progress?.completed || 0}/{progress?.total || config.iterations}
              </span>
            </div>
            <div className="mt-2 h-2 rounded bg-vault-dark">
              <div className="h-2 rounded bg-oxide-green" style={{ width: `${percentComplete}%` }} />
            </div>
            {progress?.best && (
              <p className="mt-2 text-sm text-vault-text-dim">
                Best: {progress.best.id} at {progress.best.objectiveScore.toFixed(1)}
              </p>
            )}
            {error && (
              <p className="mt-2 rounded border border-alert-red/45 bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="label">Top candidates</p>
              <div className="flex flex-wrap gap-2">
                <LabButton onClick={() => report && downloadText('balance-autopilot.json', exportAutopilotJson(report), 'application/json')} disabled={!report}>
                  JSON
                </LabButton>
                <LabButton onClick={() => report && downloadText('balance-autopilot.csv', exportAutopilotCsv(report), 'text/csv')} disabled={!report}>
                  CSV
                </LabButton>
                <LabButton onClick={() => report && downloadText('balance-autopilot.md', exportAutopilotMarkdown(report), 'text/markdown')} disabled={!report}>
                  Markdown
                </LabButton>
                <LabButton onClick={onSaveExperiment} disabled={!report}>Save</LabButton>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                  <tr>
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Candidate</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Readiness</th>
                    <th className="py-2 pr-3">Changed</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-vault-text">
                  {(report?.topCandidates || []).map((candidate) => (
                    <tr key={candidate.id} className="border-t border-vault-border">
                      <td className="py-2 pr-3">{candidate.rank}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{candidate.id}</td>
                      <td className="py-2 pr-3">{candidate.objectiveScore.toFixed(1)}</td>
                      <td className="py-2 pr-3">{candidate.shipReadiness}</td>
                      <td className="py-2 pr-3">{candidate.changedKeys.join(', ') || 'none'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="text-oxide-green" onClick={() => setSelectedCandidateId(candidate.id)}>details</button>
                          <button type="button" className="text-tungsten" onClick={() => onApplyCandidate(candidate)}>apply</button>
                          <button type="button" className="text-vault-text-dim" onClick={() => togglePin(candidate.id)}>
                            {pinnedCandidateIds.includes(candidate.id) ? 'unpin' : 'pin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report && (
                <p className="py-8 text-center text-sm text-vault-text-dim">
                  Start the autopilot to rank candidates.
                </p>
              )}
            </div>
          </div>

          {selectedCandidate && (
            <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="label">Candidate detail</p>
                <span className="font-mono text-xs text-vault-text">{selectedCandidate.id}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Metric label="Score" value={selectedCandidate.objectiveScore.toFixed(1)} />
                <Metric label="Confidence" value={selectedCandidate.confidence} />
                <Metric label="Cost" value={selectedCandidate.implementationCost} />
                <Metric label="Variance" value={selectedCandidate.scenarioScoreVariance.toFixed(1)} />
              </div>
              <p className="mt-3 text-sm text-vault-text-dim">{selectedCandidate.riskExplanation}</p>
              <textarea
                value={candidateNotes[selectedCandidate.id] || ''}
                onChange={(event) =>
                  setCandidateNotes((current) => ({ ...current, [selectedCandidate.id]: event.target.value }))
                }
                placeholder="Playtest notes"
                className="mt-3 min-h-[90px] w-full rounded border border-vault-border bg-vault-dark p-3 text-sm text-vault-text placeholder:text-vault-text-dim"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <LabButton onClick={() => navigator.clipboard?.writeText(JSON.stringify(selectedCandidate.rules, null, 2))}>
                  Copy rules
                </LabButton>
                {Object.entries(selectedCandidate.replayLinks || {}).slice(0, 3).map(([scenario, href]) => (
                  <a key={scenario} href={href} className="min-h-[44px] rounded border border-vault-border px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:bg-vault-panel">
                    {scenario}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
          <p className="label">Seed discovery</p>
          <div className="mt-3 grid gap-2">
            {seedResults.map((item) => (
              <a key={item.seed} href={item.replayLink} className="rounded border border-vault-border bg-vault-dark px-3 py-2 text-sm text-vault-text hover:bg-vault-panel">
                <span className="font-mono text-xs text-oxide-green">{item.seed}</span>
                <span className="ml-2 text-vault-text-dim">
                  score {item.score.toFixed(1)} / {item.scenarioId} / {item.summary.rounds} rounds
                </span>
              </a>
            ))}
            {!seedResults.length && (
              <p className="text-sm text-vault-text-dim">
                Seed search results appear here.
              </p>
            )}
          </div>
        </div>

        <div className="rounded border border-vault-border bg-vault-panel/55 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Saved experiments</p>
            <select onChange={(event) => event.target.value && onLoadExperiment(event.target.value)} className="control max-w-[220px]" defaultValue="">
              <option value="">Load saved run</option>
              {savedExperiments.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Paste exported autopilot JSON"
            className="mt-3 min-h-[120px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text placeholder:text-vault-text-dim"
          />
          <div className="mt-3">
            <LabButton onClick={() => onImportExperiment(importText)} disabled={!importText.trim()}>
              Import JSON
            </LabButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlaybackPanel({ simState, playbackRound, setPlaybackRound, players, funCurve }) {
  const point = playbackRound > 0 ? funCurve[playbackRound - 1] : funCurve[funCurve.length - 1];

  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">Round playback and fun curve</p>
        <span className="font-mono text-xs text-vault-text-dim">
          {playbackRound > 0 ? `Round ${playbackRound}` : 'Current'}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={simState.roundHistory.length}
        value={playbackRound}
        onChange={(event) => setPlaybackRound(Number(event.target.value))}
        className="mt-3 w-full h-10 accent-tungsten"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Leader" value={point?.leaderName || 'None'} />
        <Metric label="Tension" value={point?.tension?.toFixed(0) || '0'} />
        <Metric label="Stuns" value={point?.stuns || 0} />
      </div>
      <div className="mt-3 grid gap-2">
        {players.map((player) => (
          <div key={player.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-sm text-vault-text">
              <span>{player.name}</span>
              <span>
                {player.locksCracked} locks / {player.tools} tools
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatIfPanel({ players, whatIfPlayer, setWhatIfPlayer, whatIf, action }) {
  const actor = players.find((player) => player.id === whatIfPlayer);

  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">What if</p>
        <select value={whatIfPlayer} onChange={(event) => setWhatIfPlayer(event.target.value)} className="control max-w-[180px]">
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-sm text-vault-text-dim">
        Compares the current bot-selected round against the selected manual action for {actor?.name || 'player'}.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric label="Manual action" value={SIM_ACTION_LABEL[action?.action || SIM_ACTION.PICK]} />
        <Metric label="Target" value={players.find((player) => player.id === action?.sabotageTarget)?.name || 'None'} />
        <Metric label="Bot winner" value={whatIf?.baselineSummary.winnerName || 'None'} />
        <Metric label="Manual winner" value={whatIf?.candidateSummary.winnerName || 'None'} />
      </div>
    </div>
  );
}

function EventLog({ events }) {
  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <p className="label">Event log</p>
      <div className="mt-3 max-h-[440px] overflow-y-auto space-y-2 pr-1">
        {events.map((event) => (
          <div key={event.id} className="rounded border border-vault-border bg-vault-panel/55 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                R{event.round} {event.type}
              </span>
              {'roll' in event && (
                <span className="font-mono text-[10px] text-vault-text-dim">
                  {event.roll}/{event.chance}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-vault-text">{event.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportPreview({ value, setValue }) {
  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <p className="label">Designer dashboard JSON</p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-3 min-h-[360px] w-full rounded border border-vault-border bg-vault-dark p-3 font-mono text-xs text-vault-text"
        spellCheck="false"
      />
    </div>
  );
}
