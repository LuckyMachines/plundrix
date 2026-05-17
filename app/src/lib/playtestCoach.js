import { buildReplayFromSeed } from './replayDirector.js';
import { runGhostBatch } from './playerTelemetryGhosts.js';
import { generateMutationReport } from './ruleMutationTimeMachine.js';

export const PLAYTEST_COACH_SCHEMA_VERSION = 1;
export const PLAYTEST_MISSION_KEY = 'plundrix-playtest-coach-missions:v1';
export const PLAYTEST_SESSION_KEY = 'plundrix-playtest-coach-sessions:v1';
export const PLAYTEST_FEEDBACK_KEY = 'plundrix-playtest-coach-feedback:v1';
export const PLAYTEST_REPORT_KEY = 'plundrix-playtest-coach-reports:v1';
export const PLAYTEST_PINNED_KEY = 'plundrix-playtest-coach-pinned:v1';

export const PLAYTEST_SOURCE_TYPES = Object.freeze([
  'simulator-smoke',
  'replay-proof',
  'ghost-report',
  'mutation-report',
  'oracle-recommendation',
  'launch-gate-blocker',
  'design-tower',
  'manual-design-question',
]);

export const PLAYTEST_CATEGORIES = Object.freeze([
  'onboarding',
  'balance',
  'replay-drama',
  'archetype-feel',
  'sabotage-fatigue',
  'tool-economy',
  'pacing',
  'contract-risk',
  'launch-readiness',
  'accessibility',
]);

export const PLAYTEST_DIFFICULTIES = Object.freeze([
  '5-minute check',
  '15-minute playtest',
  '30-minute session',
  'focused group',
  'launch rehearsal',
]);

export const TESTER_ROLES = Object.freeze([
  'new player',
  'reckless picker',
  'tool hoarder',
  'revenge saboteur',
  'leader hunter',
  'comeback hunter',
  'closer',
  'observer',
  'facilitator',
  'wallet setup tester',
]);

export const OBSERVATION_DIMENSIONS = Object.freeze([
  'understood goal',
  'understood actions',
  'felt agency',
  'felt tension',
  'felt fairness',
  'felt frustration',
  'remembered key moment',
  'would replay',
  'would share replay',
  'setup friction',
]);

export const FEEDBACK_SCALES = Object.freeze([
  '1-5 Likert',
  'pass/fail',
  'free text',
  'event marker',
  'timestamped note',
]);

export const PLAYTEST_TEMPLATES = Object.freeze({
  'first-match-onboarding': template({
    id: 'first-match-onboarding',
    title: 'First Match Onboarding',
    category: 'onboarding',
    difficulty: '15-minute playtest',
    targetRoles: ['new player', 'observer', 'facilitator'],
    setup: ['Open a fresh game or simulator scenario.', 'Do not explain optimal strategy before the first round.', 'Ask the observer to mark confusion moments.'],
    script: ['Watch whether the tester can state the goal in their own words.', 'Let the tester choose actions without coaching.', 'Ask what each action means after two rounds.'],
    facilitatorNotes: ['Avoid correcting strategy unless the tester is blocked.', 'Mark every moment where the interface needs explanation.'],
    tasks: ['Join or start a game.', 'Choose three actions.', 'Explain what happened after resolution.', 'Name one moment they remember.'],
    expectedObservations: ['Tester understands the vault race goal.', 'Actions feel distinct enough to choose intentionally.', 'Idle and no-action states are legible.'],
    passCriteria: ['Tester can explain goal and actions.', 'Tester reports agency 4 or higher.', 'No setup blocker.'],
    failCriteria: ['Tester cannot explain the goal.', 'Tester cannot distinguish two actions.', 'Setup friction blocks the session.'],
    postMatchQuestions: ['What were you trying to do?', 'Which action felt most useful?', 'What confused you?', 'Would you play another round?'],
    dataToCapture: ['comprehension rating', 'confusion moments', 'setup friction', 'remembered moment'],
    recommendedFollowUp: 'Rerun simulator onboarding scenario and update copy or action affordances.',
  }),
  'sabotage-fatigue-check': template({
    id: 'sabotage-fatigue-check',
    title: 'Sabotage Fatigue Check',
    category: 'sabotage-fatigue',
    difficulty: '15-minute playtest',
    targetRoles: ['revenge saboteur', 'leader hunter', 'observer', 'facilitator'],
    setup: ['Use a sabotage-heavy cast or stall-risk scenario.', 'Ask one tester to target the leader whenever possible.'],
    script: ['Track whether sabotage creates drama or resentment.', 'Ask stunned players whether they still feel agency.'],
    facilitatorNotes: ['Do not tell players sabotage is under test.', 'Mark repeated-stun moments.'],
    tasks: ['Play until at least two sabotages happen.', 'Ask stunned players to describe their next plan.', 'Capture one replay-worthy sabotage moment.'],
    expectedObservations: ['Sabotage creates a memorable swing.', 'Targeted players still understand recovery options.'],
    passCriteria: ['Frustration average is 3 or lower.', 'At least one player names sabotage as dramatic rather than arbitrary.'],
    failCriteria: ['Repeated sabotage creates helplessness.', 'Players stop planning after being stunned.'],
    postMatchQuestions: ['Did sabotage feel fair?', 'When were you most frustrated?', 'Did you know how to recover?'],
    dataToCapture: ['frustration rating', 'stun events', 'recovery understanding', 'replay-worthy moment'],
    recommendedFollowUp: 'Run Ghosts sabotage-den and mutation less-sabotage-fatigue comparisons.',
  }),
  'tool-hoarder-viability': template({
    id: 'tool-hoarder-viability',
    title: 'Tool Hoarder Viability',
    category: 'tool-economy',
    difficulty: '15-minute playtest',
    targetRoles: ['tool hoarder', 'reckless picker', 'observer', 'facilitator'],
    setup: ['Assign one tester to search more than they pick.', 'Assign another tester to apply early pick pressure.'],
    script: ['Watch whether hoarding tools feels like a real plan.', 'Compare payoff clarity against early picking.'],
    facilitatorNotes: ['Do not tell the Tool Hoarder whether their plan is correct.', 'Mark when the hoarder decides to switch to picking.'],
    tasks: ['Build a tool stack.', 'Attempt to convert tools into locks.', 'Explain whether the delayed payoff felt worth it.'],
    expectedObservations: ['Tool Hoarder can affect the result.', 'Other players understand why search matters.'],
    passCriteria: ['Tool role reports agency 4 or higher.', 'Table can identify the hoarder strategy.'],
    failCriteria: ['Tool role feels useless.', 'Hoarding creates stall without payoff.'],
    postMatchQuestions: ['When did tools feel valuable?', 'Did waiting feel strategic or boring?', 'Would you try this style again?'],
    dataToCapture: ['agency rating', 'tool payoff moment', 'stall moment', 'role viability'],
    recommendedFollowUp: 'Run Ghosts greedy-table and Rule Mutation more-tool-economy comparisons.',
  }),
  'comeback-readability': template({
    id: 'comeback-readability',
    title: 'Comeback Readability Check',
    category: 'balance',
    difficulty: '15-minute playtest',
    targetRoles: ['comeback hunter', 'leader hunter', 'closer', 'observer'],
    setup: ['Use comeback-test or a replay with a leader and trailing players.', 'Ask one player to recover from behind.'],
    script: ['Observe whether the comeback path is visible before it happens.', 'Ask players to call the leader and threat each round.'],
    facilitatorNotes: ['Avoid explaining comeback mechanics until after the match.'],
    tasks: ['Play from a leader/trailer state.', 'Identify who can still win.', 'Describe the turn where the race changed.'],
    expectedObservations: ['Trailing players can name a recovery plan.', 'Other players see the comeback forming.'],
    passCriteria: ['At least two testers identify a credible comeback path.', 'Remembered moment includes a swing.'],
    failCriteria: ['Leader feels inevitable.', 'Comeback feels random or invisible.'],
    postMatchQuestions: ['Who did you think would win?', 'When did that change?', 'Could the trailing player do anything?'],
    dataToCapture: ['leader prediction', 'swing moment', 'agency rating', 'fairness rating'],
    recommendedFollowUp: 'Run mutation more-comeback and Replay Director comeback proof.',
  }),
  'closer-dominance-check': template({
    id: 'closer-dominance-check',
    title: 'Closer Dominance Check',
    category: 'balance',
    difficulty: '15-minute playtest',
    targetRoles: ['closer', 'tool hoarder', 'leader hunter', 'observer'],
    setup: ['Assign one tester to prioritize final-lock pressure.', 'Ask others to disrupt or build tools naturally.'],
    script: ['Check whether Closer feels smart or inevitable.', 'Track who could stop the final push.'],
    facilitatorNotes: ['Do not reveal the dominance hypothesis until the end.'],
    tasks: ['Play one match with a Closer role.', 'Call out near-win threats.', 'Ask whether the table had counterplay.'],
    expectedObservations: ['Closer can win, but table sees counterplay.'],
    passCriteria: ['Counterplay is named by two testers.', 'Closer victory does not feel inevitable.'],
    failCriteria: ['Closer wins without meaningful resistance.', 'Other roles feel decorative.'],
    postMatchQuestions: ['Could anyone stop the Closer?', 'Was the ending tense or obvious?', 'Which role felt weakest?'],
    dataToCapture: ['dominance rating', 'counterplay notes', 'near-win moments'],
    recommendedFollowUp: 'Run Ghosts balanced-cast and mutation clutch/less-hoarding checks.',
  }),
  'mutation-ab-playtest': template({
    id: 'mutation-ab-playtest',
    title: 'Mutation A/B Playtest',
    category: 'balance',
    difficulty: '30-minute session',
    targetRoles: ['new player', 'reckless picker', 'tool hoarder', 'observer', 'facilitator'],
    setup: ['Play baseline first, then candidate rules with the same scenario and role prompts.', 'Do not describe the rule diff until after both runs.'],
    script: ['Ask testers to compare pacing, fairness, and memorable moments after both runs.', 'Watch whether the expected improvement is noticeable.'],
    facilitatorNotes: ['Keep explanation of changed numbers hidden until final questions.', 'Use the same seed or scenario shape where possible.'],
    tasks: ['Play baseline.', 'Play candidate.', 'Compare the two experiences.', 'Choose which should be tested deeper.'],
    expectedObservations: ['Candidate improvement is felt by humans.', 'Regression is either absent or understood.'],
    passCriteria: ['Candidate is preferred by most testers.', 'No major fairness or frustration regression.'],
    failCriteria: ['Testers cannot perceive the intended improvement.', 'Candidate increases frustration or confusion.'],
    postMatchQuestions: ['Which version was better?', 'What changed?', 'Which felt fairer?', 'Which had the better story?'],
    dataToCapture: ['preference', 'perceived change', 'fairness delta', 'frustration delta'],
    recommendedFollowUp: 'Promote candidate to normal mutation matrix or reject it.',
  }),
  'replay-memory-check': template({
    id: 'replay-memory-check',
    title: 'Replay Memory Check',
    category: 'replay-drama',
    difficulty: '5-minute check',
    targetRoles: ['observer', 'new player', 'facilitator'],
    setup: ['Show one replay or replay summary without explaining every mechanic.', 'Ask the tester to retell what happened.'],
    script: ['Capture the moment they remember first.', 'Ask whether they would share the replay.'],
    facilitatorNotes: ['Do not correct the retelling until after notes are captured.'],
    tasks: ['Watch or read the replay.', 'Retell the story.', 'Name the dramatic turn.', 'Decide whether it is shareable.'],
    expectedObservations: ['Tester remembers one clear turn.', 'Replay is legible enough to retell.'],
    passCriteria: ['Tester can retell the main swing.', 'Would-share rating is 4 or higher.'],
    failCriteria: ['Tester cannot explain why the replay mattered.', 'No remembered moment.'],
    postMatchQuestions: ['What happened?', 'Who changed the race?', 'Would you send this to someone?'],
    dataToCapture: ['remembered moment', 'retelling accuracy', 'share intent'],
    recommendedFollowUp: 'Use Replay Director to generate stronger proof or simplify replay copy.',
  }),
  'launch-rehearsal': template({
    id: 'launch-rehearsal',
    title: 'Launch Rehearsal',
    category: 'launch-readiness',
    difficulty: 'launch rehearsal',
    targetRoles: ['wallet setup tester', 'new player', 'observer', 'facilitator'],
    setup: ['Use the target environment.', 'Start from a fresh browser/session.', 'Record every setup and wallet friction point.'],
    script: ['Walk through route load, wallet connect, game discovery, game join, one round, and replay review.'],
    facilitatorNotes: ['Only intervene when the session is blocked.', 'Mark exact route and step for every failure.'],
    tasks: ['Open app.', 'Connect wallet.', 'Find or create game.', 'Submit one action.', 'Review result or replay.'],
    expectedObservations: ['Setup path is complete.', 'Network and wallet states are understandable.'],
    passCriteria: ['Tester reaches a resolved round.', 'No blocker remains unresolved.'],
    failCriteria: ['Wallet/network blocks session.', 'Tester cannot reach a playable state.'],
    postMatchQuestions: ['Where did setup slow down?', 'What did you expect to happen next?', 'Would you trust this launch flow?'],
    dataToCapture: ['setup friction', 'blocked step', 'route health', 'wallet state'],
    recommendedFollowUp: 'Run Launch Copilot and close launch gate blockers.',
  }),
  'wallet-setup-friction': template({
    id: 'wallet-setup-friction',
    title: 'Wallet Setup Friction Check',
    category: 'launch-readiness',
    difficulty: '5-minute check',
    targetRoles: ['wallet setup tester', 'observer'],
    setup: ['Use a fresh session and the target chain.', 'Ask tester to narrate wallet/network expectations.'],
    script: ['Capture every hesitation before game entry.'],
    facilitatorNotes: ['Do not pre-explain network switching unless blocked.'],
    tasks: ['Open app.', 'Connect wallet.', 'Confirm network state.', 'Find a playable action.'],
    expectedObservations: ['Network state and next action are clear.'],
    passCriteria: ['Wallet connection completes.', 'Tester knows whether they are on the right chain.'],
    failCriteria: ['Tester is blocked by wallet or network copy.'],
    postMatchQuestions: ['What did the wallet ask you to do?', 'What did you expect after connecting?'],
    dataToCapture: ['blocked step', 'confusion moment', 'setup friction'],
    recommendedFollowUp: 'Fix wallet copy or network banner before launch rehearsal.',
  }),
  'accessibility-scan': template({
    id: 'accessibility-scan',
    title: 'Accessibility Scan',
    category: 'accessibility',
    difficulty: '15-minute playtest',
    targetRoles: ['observer', 'new player', 'facilitator'],
    setup: ['Enable reduced-motion or accessibility toggles where relevant.', 'Ask tester to navigate without speed pressure.'],
    script: ['Watch focus, contrast, text legibility, and action comprehension.'],
    facilitatorNotes: ['Mark every small text or control ambiguity.'],
    tasks: ['Navigate main surfaces.', 'Choose an action.', 'Read a result.', 'Open help or docs.'],
    expectedObservations: ['Controls and feedback remain legible and reachable.'],
    passCriteria: ['Tester completes tasks without visual or interaction blocker.'],
    failCriteria: ['Text, controls, or motion blocks comprehension.'],
    postMatchQuestions: ['What was hard to read?', 'What control felt unclear?', 'Did motion help or distract?'],
    dataToCapture: ['legibility issue', 'control issue', 'motion issue'],
    recommendedFollowUp: 'Patch UI accessibility issues and rerun scan.',
  }),
});

function template(input) {
  return Object.freeze(input);
}

function nowIso() {
  return new Date().toISOString();
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function seededIndex(seed, salt, length) {
  return hashString(`${seed}:${salt}`) % Math.max(1, length);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function selectMissionTemplate(input = {}) {
  const sourceType = input.sourceType || input.source || 'manual-design-question';
  const artifact = input.artifact || {};
  const category = input.category;
  if (sourceType === 'mutation-report' || artifact.verdict) {
    return PLAYTEST_TEMPLATES['mutation-ab-playtest'];
  }
  if (sourceType === 'ghost-report' || artifact.archetypes) {
    const riskiest = artifact.riskiestArchetype?.archetypeId || artifact.riskiestArchetype?.label || '';
    if (/tool/i.test(riskiest) || category === 'tool-economy') return PLAYTEST_TEMPLATES['tool-hoarder-viability'];
    if ((artifact.score?.frustrationRisk || 0) > 50 || category === 'sabotage-fatigue') return PLAYTEST_TEMPLATES['sabotage-fatigue-check'];
    if (/closer/i.test(riskiest) || category === 'balance') return PLAYTEST_TEMPLATES['closer-dominance-check'];
    return PLAYTEST_TEMPLATES['tool-hoarder-viability'];
  }
  if (sourceType === 'replay-proof' || artifact.dramaticScore) return PLAYTEST_TEMPLATES['replay-memory-check'];
  if (sourceType === 'oracle-recommendation') {
    if (category === 'balance') return PLAYTEST_TEMPLATES['mutation-ab-playtest'];
    if (category === 'replay-drama') return PLAYTEST_TEMPLATES['replay-memory-check'];
    if (category === 'launch-readiness') return PLAYTEST_TEMPLATES['launch-rehearsal'];
  }
  if (sourceType === 'design-tower') {
    if (category === 'balance') return PLAYTEST_TEMPLATES['mutation-ab-playtest'];
    if (category === 'archetype-feel' || category === 'tool-economy') return PLAYTEST_TEMPLATES['tool-hoarder-viability'];
    if (category === 'sabotage-fatigue') return PLAYTEST_TEMPLATES['sabotage-fatigue-check'];
    if (category === 'replay-drama') return PLAYTEST_TEMPLATES['replay-memory-check'];
    if (category === 'launch-readiness') return PLAYTEST_TEMPLATES['launch-rehearsal'];
  }
  if (sourceType === 'launch-gate-blocker') {
    const text = `${artifact.title || ''} ${artifact.category || ''}`.toLowerCase();
    if (text.includes('wallet') || text.includes('env') || text.includes('network')) return PLAYTEST_TEMPLATES['wallet-setup-friction'];
    return PLAYTEST_TEMPLATES['launch-rehearsal'];
  }
  if (category === 'accessibility') return PLAYTEST_TEMPLATES['accessibility-scan'];
  if (category === 'sabotage-fatigue') return PLAYTEST_TEMPLATES['sabotage-fatigue-check'];
  if (category === 'tool-economy') return PLAYTEST_TEMPLATES['tool-hoarder-viability'];
  if (category === 'replay-drama') return PLAYTEST_TEMPLATES['replay-memory-check'];
  if (category === 'launch-readiness') return PLAYTEST_TEMPLATES['launch-rehearsal'];
  return PLAYTEST_TEMPLATES['first-match-onboarding'];
}

export function hydrateMissionFromArtifact(templateConfig, artifact = {}, input = {}) {
  const mutation = artifact.comparison || artifact.report?.comparison || null;
  const ghost = artifact.ghostStatus || artifact.ghostReport || artifact;
  const replay = artifact.replay || artifact;
  return {
    seed: input.seed || mutation?.scenario?.seed || replay.seed || 'playtest-coach',
    scenario: input.scenario || mutation?.scenario?.simulatorScenarioId || replay.scenarioId || 'new-player-table',
    ghostScenario: input.ghostScenario || mutation?.scenario?.ghostScenario || 'balanced-cast',
    mutationPreset: input.mutationPreset || mutation?.scenario?.presetId || 'faster-games',
    ruleDiff: mutation?.ruleDiff || artifact.ruleDiff || [],
    baselineRules: input.baselineRules || mutation?.scenario?.baselineRules || null,
    candidateRules: input.candidateRules || mutation?.scenario?.candidateRules || null,
    ghostArchetypes: ghost.archetypes || ghost.archetypeViability || [],
    replayLink: input.replayLink || replay.shareUrl || mutation?.replayLinks?.better || '',
    launchGate: input.launchGate || artifact.targetGate || '',
    risks: artifact.risks || mutation?.risks || [],
    recommendations: artifact.recommendations || (artifact.recommendation ? [artifact.recommendation] : []),
    expectedRegression: mutation?.recommendation?.regressed || [],
    targetObservation: input.question || templateConfig.expectedObservations[0],
  };
}

export function assignTesterRoles(mission, testers = mission.availableTesters || 4) {
  const count = clamp(testers, 1, 6);
  const roles = mission.template.targetRoles.length ? [...mission.template.targetRoles] : ['new player', 'observer', 'facilitator'];
  const assignments = Array.from({ length: count }, (_, index) => {
    const role = roles[(index + seededIndex(mission.seed, `role-${index}`, roles.length)) % roles.length];
    return {
      testerId: `tester-${index + 1}`,
      label: `Tester ${index + 1}`,
      role,
      briefId: `${mission.id}-brief-${index + 1}`,
    };
  });
  if (!assignments.some((item) => item.role === 'facilitator')) {
    assignments[assignments.length - 1].role = 'facilitator';
  }
  return assignments;
}

export function buildFacilitatorScript(mission) {
  return {
    preTestSetup: mission.template.setup,
    introText: `Today we are testing ${mission.title}. Please narrate what you are trying to do, and do not worry about winning perfectly.`,
    roleInstructions: mission.roleAssignments.map((item) => `${item.label}: ${item.role}`),
    roundPrompts: [
      'Before the action, ask what each player thinks their best move is.',
      'After resolution, ask what changed and who is threatening the vault.',
      'Mark any confusion, frustration, or replay-worthy moment immediately.',
    ],
    interventionRules: [
      'Intervene only when setup or rules comprehension blocks the session.',
      'Do not reveal the hidden design hypothesis before final questions.',
      'Do not coach optimal strategy during the first pass.',
    ],
    closingQuestions: mission.template.postMatchQuestions,
  };
}

export function buildTesterBriefs(mission) {
  return mission.roleAssignments.map((assignment) => ({
    id: assignment.briefId,
    testerId: assignment.testerId,
    role: assignment.role,
    goal: testerGoal(assignment.role, mission),
    behaviorPrompt: testerBehaviorPrompt(assignment.role),
    payAttentionTo: ['moments of agency', 'moments of confusion', 'fairness of outcomes', 'whether a replay story forms'],
    doNotOptimizeFor: ['perfect strategy', 'pleasing the facilitator', 'guessing the hidden hypothesis'],
    postMatchQuestions: mission.template.postMatchQuestions,
  }));
}

function testerGoal(role, mission) {
  if (role === 'facilitator') return 'Run the script and capture clean observations.';
  if (role === 'observer') return 'Watch for confusion, frustration, tension, and replay-worthy moments.';
  if (role === 'wallet setup tester') return 'Reach a playable state and narrate every setup friction point.';
  return `Play as a ${role} and report whether that style feels viable and fun. Mission: ${mission.title}.`;
}

function testerBehaviorPrompt(role) {
  const prompts = {
    'reckless picker': 'Apply lock pressure early and keep trying to finish.',
    'tool hoarder': 'Search often, build tools, and decide when to cash in.',
    'revenge saboteur': 'Remember who disrupts you and answer with sabotage.',
    'leader hunter': 'Track the leader and keep the table compressed.',
    'comeback hunter': 'Recover from behind and look for late swings.',
    closer: 'Stay alive, then prioritize final-lock pressure.',
    'new player': 'Play naturally and say what you think each action does.',
  };
  return prompts[role] || 'Follow the mission and narrate what you notice.';
}

export function buildObservationSheet(mission) {
  return {
    dimensions: OBSERVATION_DIMENSIONS.map((dimension) => ({
      id: dimension.replaceAll(' ', '-'),
      label: dimension,
      scale: dimension.includes('moment') ? 'free text' : '1-5 Likert',
    })),
    passFailChecks: mission.template.passCriteria.map((criterion) => ({ criterion, pass: null })),
    eventMarkers: [
      'confusion moment',
      'frustration moment',
      'replay-worthy moment',
      'setup blocker',
      'agency recovery moment',
      'fairness concern',
    ],
    noteFields: ['timestamp', 'round', 'tester', 'event', 'note'],
    checkboxes: ['replay-worthy moment', 'confusion moment', 'frustration moment'],
  };
}

export function buildPassFailRubric(mission) {
  return {
    pass: mission.template.passCriteria,
    fail: mission.template.failCriteria,
    needsFollowUp: ['Mixed ratings, disagreement between tester roles, or one unresolved high-severity issue.'],
    inconclusive: ['Session ended early, wrong setup was used, or feedback is missing.'],
  };
}

export function buildPlaytestMission(input = {}) {
  const templateConfig = selectMissionTemplate(input);
  const hydrated = hydrateMissionFromArtifact(templateConfig, input.artifact || {}, input);
  const mission = {
    schemaVersion: PLAYTEST_COACH_SCHEMA_VERSION,
    id: `playtest-mission-${hashString(JSON.stringify({ template: templateConfig.id, seed: hydrated.seed, question: input.question || '' })).toString(16)}`,
    createdAt: nowIso(),
    sourceType: input.sourceType || input.source || 'manual-design-question',
    category: input.category || templateConfig.category,
    difficulty: input.duration || input.difficulty || templateConfig.difficulty,
    title: input.title || templateConfig.title,
    designQuestion: input.question || hydrated.targetObservation,
    availableTesters: clamp(input.testers || 4, 1, 6),
    seed: hydrated.seed,
    scenario: hydrated.scenario,
    ghostScenario: hydrated.ghostScenario,
    mutationPreset: hydrated.mutationPreset,
    template: templateConfig,
    artifactSummary: hydrated,
    roleAssignments: [],
    facilitatorScript: null,
    testerBriefs: [],
    observationSheet: null,
    rubric: null,
    recommendedMachineRuns: recommendedMachineRuns(templateConfig, hydrated),
    recommendedFollowUp: templateConfig.recommendedFollowUp,
  };
  mission.roleAssignments = assignTesterRoles(mission, mission.availableTesters);
  mission.facilitatorScript = buildFacilitatorScript(mission);
  mission.testerBriefs = buildTesterBriefs(mission);
  mission.observationSheet = buildObservationSheet(mission);
  mission.rubric = buildPassFailRubric(mission);
  validatePlaytestMission(mission);
  return mission;
}

function recommendedMachineRuns(templateConfig, hydrated) {
  const runs = [];
  if (templateConfig.id.includes('mutation')) runs.push(`npm run mutate:rules -- --preset ${hydrated.mutationPreset} --budget smoke --markdown`);
  if (templateConfig.category === 'archetype-feel' || templateConfig.category === 'tool-economy' || templateConfig.category === 'sabotage-fatigue') {
    runs.push(`npm run ghosts:run -- --scenario ${hydrated.ghostScenario} --budget smoke --markdown`);
  }
  if (templateConfig.category === 'replay-drama') runs.push('npm run replay:direct -- --seed playtest-replay --scenario comeback-test');
  if (templateConfig.category === 'launch-readiness') runs.push('npm run launch:copilot -- --target internal-playtest --markdown');
  if (!runs.length) runs.push('npm run simulate');
  return runs;
}

export function scorePlaytestFeedback(mission, feedback = {}) {
  const scores = {
    comprehension: clamp(feedback.comprehension ?? feedback.understoodGoal ?? 3, 1, 5),
    agency: clamp(feedback.agency ?? 3, 1, 5),
    tension: clamp(feedback.tension ?? 3, 1, 5),
    fairness: clamp(feedback.fairness ?? 3, 1, 5),
    frustration: clamp(feedback.frustration ?? 3, 1, 5),
    replayability: clamp(feedback.replayability ?? 3, 1, 5),
    launchFriction: clamp(feedback.setupFriction ?? 3, 1, 5),
  };
  const overall =
    scores.comprehension * 14 +
    scores.agency * 16 +
    scores.tension * 12 +
    scores.fairness * 14 +
    (6 - scores.frustration) * 14 +
    scores.replayability * 12 +
    (6 - scores.launchFriction) * 8;
  const normalized = Math.round(clamp(overall / 4.5, 0, 100));
  const outcome = rubricOutcome(mission, scores, feedback, normalized);
  return {
    schemaVersion: PLAYTEST_COACH_SCHEMA_VERSION,
    missionId: mission.id,
    scoredAt: nowIso(),
    scores,
    overallScore: normalized,
    outcome,
    rememberedMoment: feedback.rememberedMoment || '',
    confusionMoment: feedback.confusionMoment || '',
    frustrationMoment: feedback.frustrationMoment || '',
    wouldReplay: Boolean(feedback.wouldReplay),
    wouldShare: Boolean(feedback.wouldShare),
    notes: feedback.notes || '',
    eventMarkers: feedback.eventMarkers || [],
  };
}

function rubricOutcome(mission, scores, feedback, normalized) {
  if (feedback.inconclusive) return 'inconclusive';
  if (scores.comprehension <= 2 || scores.agency <= 2 || scores.launchFriction >= 5) return 'fail';
  if (normalized >= 76 && scores.frustration <= 3) return 'pass';
  if (normalized >= 56) return 'needs follow-up';
  return 'fail';
}

export function summarizePlaytestSession(session) {
  const scored = session.feedbackScores || [];
  const aggregate = aggregateFeedback(scored);
  const strongestEvidence = scored
    .flatMap((item) => [item.rememberedMoment, item.confusionMoment, item.frustrationMoment].filter(Boolean))
    .slice(0, 6);
  const outcome = aggregate.overallScore >= 76 ? 'pass' : aggregate.overallScore >= 56 ? 'needs follow-up' : 'fail';
  return {
    sessionId: session.id,
    missionId: session.missionId,
    keyFinding: `${outcome}: aggregate score ${aggregate.overallScore}/100.`,
    strongestEvidence,
    contradictedAssumptions: scored.filter((item) => item.outcome === 'fail').map((item) => item.notes).filter(Boolean),
    recommendedNextAction: outcome === 'pass' ? 'Promote the finding to Oracle and Launch notes.' : 'Rerun the relevant machine check, patch the issue, and test again.',
    machineSignalConfirmed: outcome === 'pass',
    rerunMachine: outcome !== 'pass',
    aggregate,
    outcome,
  };
}

function aggregateFeedback(scored) {
  const keys = ['comprehension', 'agency', 'tension', 'fairness', 'frustration', 'replayability', 'launchFriction'];
  const scores = Object.fromEntries(keys.map((key) => [key, average(scored.map((item) => item.scores?.[key] || 0))]));
  return {
    ...scores,
    overallScore: Math.round(average(scored.map((item) => item.overallScore))),
    count: scored.length,
  };
}

export function generatePlaytestReport(mission, sessions = []) {
  const summaries = sessions.map(summarizePlaytestSession);
  const aggregateScore = Math.round(average(summaries.map((item) => item.aggregate.overallScore)));
  const result = aggregateScore >= 76 ? 'pass' : aggregateScore >= 56 ? 'needs follow-up' : sessions.length ? 'fail' : 'inconclusive';
  const report = {
    schemaVersion: PLAYTEST_COACH_SCHEMA_VERSION,
    id: `playtest-report-${hashString(JSON.stringify({ missionId: mission.id, sessions: sessions.length })).toString(16)}`,
    generatedAt: nowIso(),
    mission,
    sessions: summaries,
    aggregateScores: sessions.length ? aggregateFeedback(sessions.flatMap((session) => session.feedbackScores || [])) : null,
    quotes: summaries.flatMap((item) => item.strongestEvidence).slice(0, 10),
    eventMarkers: sessions.flatMap((session) => session.feedbackScores || []).flatMap((item) => item.eventMarkers || []),
    result,
    decisionRecommendation: decisionRecommendation(result, mission),
    nextMachineRun: mission.recommendedMachineRuns[0],
    nextHumanTest: result === 'pass' ? 'Test a harder scenario or launch rehearsal.' : mission.recommendedFollowUp,
  };
  validatePlaytestReport(report);
  return report;
}

function decisionRecommendation(result, mission) {
  if (result === 'pass') return `Accept the ${mission.category} finding and continue validation.`;
  if (result === 'needs follow-up') return `Run one focused follow-up before changing ${mission.category} direction.`;
  if (result === 'fail') return `Do not promote this ${mission.category} direction until the failure is patched.`;
  return 'Collect at least one complete session before deciding.';
}

export function generatePlaytestBacklog(inputs = {}) {
  const items = [];
  const add = (item) => items.push({ status: 'open', ...item });
  for (const risk of inputs.ghostRisks || inputs.ghostReport?.risks || []) {
    add(backlogItem('ghost-report', 'archetype-feel', risk.title, risk.mitigation, 4, severityUrgency(risk.severity), 3, 2, 3, risk));
  }
  for (const risk of inputs.mutationRisks || inputs.mutationReport?.risks || inputs.mutationSnapshot?.risks || []) {
    add(backlogItem('mutation-report', 'balance', risk.title, risk.mitigation, 5, severityUrgency(risk.severity), 4, 2, 4, risk));
  }
  for (const blocker of inputs.launchBlockers || []) {
    add(backlogItem('launch-gate-blocker', 'launch-readiness', blocker.title || blocker, blocker.remediation || 'Validate launch flow with humans.', 5, 5, 4, 2, 5, blocker));
  }
  for (const rec of inputs.oracleRecommendations || []) {
    add(backlogItem('oracle-recommendation', rec.category || 'balance', rec.title, rec.rationale, rec.impact || 3, rec.urgency || 2, 4, rec.effort || 2, 3, rec));
  }
  if (inputs.replayOpportunity) {
    add(backlogItem('replay-proof', 'replay-drama', 'Validate replay memory', 'Check whether testers can retell the strongest replay.', 3, 2, 3, 1, 2, inputs.replayOpportunity));
  }
  if (!items.length) {
    add(backlogItem('manual-design-question', 'onboarding', 'First match onboarding check', 'Validate goal, action comprehension, agency, and replay memory.', 4, 3, 3, 1, 3, {}));
  }
  return items
    .map((item) => ({
      ...item,
      score: item.impact * 2 + item.urgency * 2 + item.confidenceGap + item.launchRelevance - item.effort,
      mission: buildPlaytestMission({
        sourceType: item.sourceType,
        category: item.category,
        question: item.title,
        artifact: item.artifact,
        testers: 4,
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function backlogItem(sourceType, category, title, rationale, impact, urgency, confidenceGap, effort, launchRelevance, artifact) {
  return { id: `playtest-backlog-${hashString(`${sourceType}:${title}`).toString(16)}`, sourceType, category, title, rationale, impact, urgency, confidenceGap, effort, launchRelevance, artifact };
}

function severityUrgency(severity = 'yellow') {
  return { red: 5, orange: 4, yellow: 3, green: 1 }[severity] || 2;
}

export function buildMissionFromSimulator(options = {}) {
  return buildPlaytestMission({ sourceType: 'simulator-smoke', category: 'onboarding', ...options });
}

export function buildMissionFromReplay(replay = buildReplayFromSeed({ seed: 'playtest-replay', scenarioId: 'comeback-test' }), options = {}) {
  return buildPlaytestMission({ sourceType: 'replay-proof', category: 'replay-drama', artifact: replay, replayLink: replay.shareUrl, ...options });
}

export function buildMissionFromGhostReport(report = runGhostBatch({ budget: 'smoke', games: 3 }), options = {}) {
  return buildPlaytestMission({ sourceType: 'ghost-report', category: 'archetype-feel', artifact: report, ...options });
}

export function buildMissionFromMutationReport(report = generateMutationReport({ budget: 'smoke' }), options = {}) {
  return buildPlaytestMission({ sourceType: 'mutation-report', category: 'balance', artifact: report, ...options });
}

export function exportPlaytestMissionMarkdown(mission) {
  return [
    '# Plundrix Playtest Mission',
    '',
    `Title: ${mission.title}`,
    `Category: ${mission.category}`,
    `Difficulty: ${mission.difficulty}`,
    `Question: ${mission.designQuestion}`,
    `Seed: ${mission.seed}`,
    `Scenario: ${mission.scenario}`,
    '',
    '## Setup',
    ...mission.template.setup.map((item) => `- ${item}`),
    '',
    '## Facilitator Script',
    mission.facilitatorScript.introText,
    ...mission.facilitatorScript.roundPrompts.map((item) => `- ${item}`),
    '',
    '## Roles',
    ...mission.roleAssignments.map((item) => `- ${item.label}: ${item.role}`),
    '',
    '## Tasks',
    ...mission.template.tasks.map((item) => `- ${item}`),
    '',
    '## Pass Criteria',
    ...mission.template.passCriteria.map((item) => `- ${item}`),
    '',
    '## Questions',
    ...mission.template.postMatchQuestions.map((item) => `- ${item}`),
    '',
    '## Recommended Machine Runs',
    ...mission.recommendedMachineRuns.map((item) => `- ${item}`),
    '',
  ].join('\n');
}

export function exportPlaytestMissionJson(mission) {
  return JSON.stringify(mission, null, 2);
}

export function exportPlaytestReportMarkdown(report) {
  return [
    '# Plundrix Playtest Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Mission: ${report.mission.title}`,
    `Result: ${report.result}`,
    `Decision: ${report.decisionRecommendation}`,
    '',
    '## Session Summaries',
    ...report.sessions.map((item) => `- ${item.keyFinding} Next: ${item.recommendedNextAction}`),
    '',
    '## Evidence',
    ...(report.quotes.length ? report.quotes.map((item) => `- ${item}`) : ['- No session evidence captured yet.']),
    '',
    '## Next Runs',
    `Machine: ${report.nextMachineRun}`,
    `Human: ${report.nextHumanTest}`,
    '',
  ].join('\n');
}

export function exportPlaytestBacklogCsv(backlog) {
  const rows = [
    ['rank', 'sourceType', 'category', 'title', 'impact', 'urgency', 'confidenceGap', 'effort', 'launchRelevance', 'score'],
    ...backlog.map((item) => [item.rank, item.sourceType, item.category, item.title, item.impact, item.urgency, item.confidenceGap, item.effort, item.launchRelevance, item.score]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function validatePlaytestMission(mission) {
  const required = ['schemaVersion', 'id', 'sourceType', 'category', 'difficulty', 'title', 'template', 'roleAssignments', 'facilitatorScript'];
  for (const key of required) {
    if (!(key in mission)) throw new Error(`Playtest mission missing required field: ${key}`);
  }
  if (mission.schemaVersion !== PLAYTEST_COACH_SCHEMA_VERSION) throw new Error(`Unsupported playtest mission schema: ${mission.schemaVersion}`);
  if (!PLAYTEST_SOURCE_TYPES.includes(mission.sourceType)) throw new Error(`Unsupported playtest source: ${mission.sourceType}`);
  return true;
}

export function validatePlaytestSession(session) {
  const required = ['id', 'missionId', 'startedAt', 'feedbackScores'];
  for (const key of required) {
    if (!(key in session)) throw new Error(`Playtest session missing required field: ${key}`);
  }
  return true;
}

export function validatePlaytestReport(report) {
  const required = ['schemaVersion', 'id', 'generatedAt', 'mission', 'sessions', 'result', 'decisionRecommendation'];
  for (const key of required) {
    if (!(key in report)) throw new Error(`Playtest report missing required field: ${key}`);
  }
  if (report.schemaVersion !== PLAYTEST_COACH_SCHEMA_VERSION) throw new Error(`Unsupported playtest report schema: ${report.schemaVersion}`);
  return true;
}

export function migratePlaytestMission(mission) {
  if (mission.schemaVersion === PLAYTEST_COACH_SCHEMA_VERSION) return mission;
  return { ...mission, schemaVersion: PLAYTEST_COACH_SCHEMA_VERSION };
}

export function migratePlaytestReport(report) {
  if (report.schemaVersion === PLAYTEST_COACH_SCHEMA_VERSION) return report;
  return { ...report, schemaVersion: PLAYTEST_COACH_SCHEMA_VERSION };
}

function readStorage(key) {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeStorage(key, value) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(key, JSON.stringify(value));
  return true;
}

export function savePlaytestMission(mission) {
  validatePlaytestMission(mission);
  const missions = [mission, ...readStorage(PLAYTEST_MISSION_KEY).filter((item) => item.id !== mission.id)].slice(0, 60);
  writeStorage(PLAYTEST_MISSION_KEY, missions);
  return missions;
}

export function listPlaytestMissions() {
  return readStorage(PLAYTEST_MISSION_KEY).map(migratePlaytestMission);
}

export function savePlaytestSession(session) {
  validatePlaytestSession(session);
  const sessions = [session, ...readStorage(PLAYTEST_SESSION_KEY).filter((item) => item.id !== session.id)].slice(0, 80);
  writeStorage(PLAYTEST_SESSION_KEY, sessions);
  return sessions;
}

export function listPlaytestSessions() {
  return readStorage(PLAYTEST_SESSION_KEY);
}

export function savePlaytestFeedback(feedback) {
  const items = [feedback, ...readStorage(PLAYTEST_FEEDBACK_KEY)].slice(0, 200);
  writeStorage(PLAYTEST_FEEDBACK_KEY, items);
  return items;
}

export function listPlaytestFeedback() {
  return readStorage(PLAYTEST_FEEDBACK_KEY);
}

export function savePlaytestReport(report) {
  validatePlaytestReport(report);
  const reports = [report, ...readStorage(PLAYTEST_REPORT_KEY).filter((item) => item.id !== report.id)].slice(0, 50);
  writeStorage(PLAYTEST_REPORT_KEY, reports);
  return reports;
}

export function listPlaytestReports() {
  return readStorage(PLAYTEST_REPORT_KEY).map(migratePlaytestReport);
}

export function pinPlaytestMission(mission) {
  validatePlaytestMission(mission);
  const pinned = [mission, ...readStorage(PLAYTEST_PINNED_KEY).filter((item) => item.id !== mission.id)].slice(0, 30);
  writeStorage(PLAYTEST_PINNED_KEY, pinned);
  return pinned;
}

export function listPinnedPlaytestMissions() {
  return readStorage(PLAYTEST_PINNED_KEY).map(migratePlaytestMission);
}

export function exportPlaytestMissions() {
  return JSON.stringify(listPlaytestMissions(), null, 2);
}

export function importPlaytestMissions(text) {
  const missions = JSON.parse(text).map(migratePlaytestMission);
  missions.forEach(validatePlaytestMission);
  writeStorage(PLAYTEST_MISSION_KEY, missions);
  return missions;
}

export function createSyntheticPlaytestSession(mission, feedback = {}) {
  const scored = scorePlaytestFeedback(mission, feedback);
  return {
    id: `playtest-session-${hashString(JSON.stringify({ missionId: mission.id, feedback })).toString(16)}`,
    missionId: mission.id,
    startedAt: nowIso(),
    completedAt: nowIso(),
    feedbackScores: [scored],
    notes: feedback.notes || '',
  };
}
