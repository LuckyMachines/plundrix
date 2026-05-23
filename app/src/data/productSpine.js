export const PRODUCT_STATEMENT =
  'Plundrix is a short-session onchain vault-heist strategy game where players Pick, Search, Sabotage, and replay the table drama.';

export const CANONICAL_TERMS = Object.freeze([
  ['Operation', 'A game instance.'],
  ['Round', 'One action cycle.'],
  ['Vault', 'The shared objective.'],
  ['Operator', 'A player at the table.'],
  ['Tool', 'A bonus found by searching the vault.'],
  ['Sabotage', 'A turn action that can slow a rival operator.'],
  ['Replay', 'A round-by-round record of what happened in a match.'],
]);

export const CTA_VERBS = Object.freeze(['Play', 'Pick', 'Search', 'Sabotage', 'Replay', 'Compare', 'Review']);

export const MATCH_SIGNAL_TYPES = Object.freeze([
  'lock progress',
  'replay',
  'tools',
  'sabotage',
  'leaderboard',
  'agents',
]);

export const PRODUCT_LOOP = Object.freeze([
  {
    id: 'play',
    label: 'Play',
    route: '/',
    summary: 'Create and play operations.',
  },
  {
    id: 'simulate',
    label: 'Practice',
    route: '/simulator',
    summary: 'Try match setups before you play.',
  },
  {
    id: 'replay',
    label: 'Replay',
    route: '/replays',
    summary: 'Review the turns that changed a match.',
  },
  {
    id: 'ghosts',
    label: 'Agents',
    route: '/ghosts',
    summary: 'Compare labeled agent playstyles.',
  },
  {
    id: 'mutate',
    label: 'Rules',
    route: '/mutations',
    summary: 'Preview alternate table rules.',
  },
]);

export const ROUTE_CLASSES = Object.freeze({
  game: 'Game',
  workbench: 'Tools',
  marketing: 'Compare',
  legal: 'Support',
  reference: 'Guide',
});

export const ROUTE_META = Object.freeze({
  '/': {
    label: 'Console',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'play',
    purpose: 'Operate and start Plundrix operations.',
    title: 'Plundrix Operations Console',
    description: PRODUCT_STATEMENT,
    primaryCta: 'Play',
    nextRoutes: ['/simulator', '/replays'],
  },
  '/leaderboard': {
    label: 'Ladder',
    navGroup: 'Play',
    routeClass: 'workbench',
    loopStep: 'play',
    purpose: 'Compare operators and agent ladders.',
    title: 'Plundrix Operator Ladder',
    description: 'Review seasonal Plundrix operators, agent ladders, points, and competitive progress.',
    primaryCta: 'Review',
    nextRoutes: ['/sessions', '/replays'],
  },
  '/sessions': {
    label: 'Sessions',
    navGroup: 'Play',
    routeClass: 'workbench',
    loopStep: 'play',
    purpose: 'Review operation history.',
    title: 'Plundrix Operation History',
    description: 'Review recent Plundrix operations, operator results, and session history.',
    primaryCta: 'Review',
    nextRoutes: ['/replays', '/leaderboard'],
  },
  '/game/:gameId': {
    label: 'Operation',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'play',
    purpose: 'Play a single Plundrix operation.',
    title: 'Plundrix Operation',
    description: 'Play a Plundrix operation with a vault stage, compact status, action dock, and table details.',
    primaryCta: 'Play',
    nextRoutes: ['/replays', '/sessions'],
  },
  '/profile/:address': {
    label: 'Profile',
    navGroup: 'Play',
    routeClass: 'workbench',
    loopStep: 'play',
    purpose: 'Review one operator profile.',
    title: 'Plundrix Operator Profile',
    description: 'Review one Plundrix operator profile, seasonal stats, playstyle, and operation history.',
    primaryCta: 'Review',
    nextRoutes: ['/leaderboard', '/sessions'],
  },
  '/snapshot': {
    label: 'Snapshot',
    navGroup: 'Reference',
    routeClass: 'reference',
    loopStep: 'replay',
    purpose: 'Render a stable game snapshot.',
    title: 'Plundrix Snapshot',
    description: 'A stable Plundrix visual snapshot for reviewing the current table state.',
    primaryCta: 'Review',
    nextRoutes: ['/replays', '/map'],
  },
  '/simulator': {
    label: 'Practice Table',
    navGroup: 'Lab',
    routeClass: 'workbench',
    loopStep: 'simulate',
    purpose: 'Try match setups.',
    title: 'Plundrix Practice Table',
    description: 'Run Plundrix practice matches, compare rule sets, and generate replay links.',
    primaryCta: 'Run',
    nextRoutes: ['/replays', '/mutations'],
  },
  '/replays': {
    label: 'Replays',
    navGroup: 'Lab',
    routeClass: 'workbench',
    loopStep: 'replay',
    purpose: 'Remember and inspect dramatic operations.',
    title: 'Plundrix Replay Director',
    description: 'Review dramatic operations, close finishes, and shareable table stories.',
    primaryCta: 'Review',
    nextRoutes: ['/simulator', '/mutations'],
  },
  '/replay/:replayId': {
    label: 'Replay',
    navGroup: 'Lab',
    routeClass: 'game',
    loopStep: 'replay',
    purpose: 'Inspect one replay.',
    title: 'Plundrix Replay',
    description: 'Inspect one Plundrix replay with timeline, highlights, dramatic scoring, and operation context.',
    primaryCta: 'Review',
    nextRoutes: ['/replays', '/simulator'],
  },
  '/ghosts': {
    label: 'Agents',
    navGroup: 'Lab',
    routeClass: 'workbench',
    loopStep: 'ghosts',
    purpose: 'Compare operator archetypes.',
    title: 'Plundrix Agent Playstyles',
    description: 'Run named operator archetypes through Plundrix to compare fairness, agency, and replay moments.',
    primaryCta: 'Run',
    nextRoutes: ['/mutations', '/replays'],
  },
  '/mutations': {
    label: 'Rules',
    navGroup: 'Lab',
    routeClass: 'workbench',
    loopStep: 'mutate',
    purpose: 'Preview rule changes.',
    title: 'Plundrix Rule Preview',
    description: 'Compare baseline and alternate Plundrix rules across practice matches, replays, and agent tables.',
    primaryCta: 'Compare',
    nextRoutes: ['/simulator', '/replays'],
  },
  '/playtest': {
    label: 'Playtest',
    navGroup: 'Lab',
    routeClass: 'workbench',
    loopStep: 'playtest',
    purpose: 'Guide match sessions.',
    title: 'Plundrix Session Coach',
    description: 'Turn practice matches, replays, agent tables, and rule previews into focused player sessions.',
    primaryCta: 'Import',
    nextRoutes: ['/design', '/ghosts'],
    public: false,
  },
  '/design': {
    label: 'Notes',
    navGroup: 'Lab',
    routeClass: 'workbench',
    loopStep: 'decide',
    purpose: 'Review match notes.',
    title: 'Plundrix Match Notes',
    description: 'Connect Plundrix questions, match signals, risks, and follow-up notes.',
    primaryCta: 'Decide',
    nextRoutes: ['/launch', '/ops'],
    public: false,
  },
  '/ops': {
    label: 'Health',
    navGroup: 'Ship',
    routeClass: 'workbench',
    loopStep: 'play',
    purpose: 'Observe live health.',
    title: 'Plundrix Live Health',
    description: 'Review Plundrix health, live activity, risks, and next recommended actions.',
    primaryCta: 'Review',
    nextRoutes: ['/launch', '/design'],
    public: false,
  },
  '/launch': {
    label: 'Status',
    navGroup: 'Ship',
    routeClass: 'workbench',
    loopStep: 'launch',
    purpose: 'Check network status.',
    title: 'Plundrix Release Status',
    description: 'Review Plundrix status checks, known risks, and network preparation notes.',
    primaryCta: 'Review',
    nextRoutes: ['/ops', '/design'],
    public: false,
  },
  '/compare': {
    label: 'Compare',
    navGroup: 'Play',
    routeClass: 'marketing',
    loopStep: 'play',
    purpose: 'Explain adjacent game fit.',
    title: 'Plundrix Game Comparisons',
    description: 'Compare Plundrix with raid games, online board games, sabotage games, and onchain strategy games.',
    primaryCta: 'Compare',
    nextRoutes: ['/', '/map'],
  },
  '/map': {
    label: 'Map',
    navGroup: 'Reference',
    routeClass: 'reference',
    loopStep: 'observe',
    purpose: 'Show how game areas connect.',
    title: 'Plundrix Game Map',
    description: 'See how Plundrix play, practice matches, replays, agents, and rules connect.',
    primaryCta: 'Review',
    nextRoutes: ['/simulator', '/replays'],
  },
  '/glossary': {
    label: 'Glossary',
    navGroup: 'Reference',
    routeClass: 'reference',
    loopStep: 'play',
    purpose: 'Define game terms.',
    title: 'Plundrix Glossary',
    description: 'Definitions for Plundrix operations, rounds, vaults, operators, tools, sabotage, and replays.',
    primaryCta: 'Review',
    nextRoutes: ['/map', '/compare'],
  },
  '/design-system': {
    label: 'UI Kit',
    navGroup: 'Reference',
    routeClass: 'reference',
    loopStep: 'play',
    purpose: 'Review the game interface.',
    title: 'Plundrix Interface Guide',
    description: 'Review Plundrix gameplay screens, action controls, vault states, operator states, event language, and match-state vocabulary.',
    primaryCta: 'Review',
    nextRoutes: ['/', '/snapshot'],
    public: false,
  },
  '/terms': {
    label: 'Terms',
    navGroup: 'Reference',
    routeClass: 'legal',
    purpose: 'State the service terms.',
    title: 'Plundrix Terms of Service',
    description: 'Terms of Service for Plundrix, including eligibility, game modes, blockchain interactions, and beta posture.',
    primaryCta: 'Review',
    nextRoutes: ['/privacy'],
  },
  '/privacy': {
    label: 'Privacy',
    navGroup: 'Reference',
    routeClass: 'legal',
    purpose: 'State the privacy policy.',
    title: 'Plundrix Privacy Policy',
    description: 'Privacy Policy for Plundrix, including data handling, wallet interactions, analytics, and service operations.',
    primaryCta: 'Review',
    nextRoutes: ['/terms'],
  },
});

export function routeMeta(path) {
  return ROUTE_META[path] || null;
}

export function loopStep(id) {
  return PRODUCT_LOOP.find((item) => item.id === id) || null;
}

export function routesForLoopStep(id) {
  return Object.entries(ROUTE_META)
    .filter(([, meta]) => meta.loopStep === id && meta.public !== false)
    .map(([path, meta]) => ({ path, ...meta }));
}

export function publicStaticRoutes() {
  return Object.entries(ROUTE_META)
    .filter(([path, meta]) => !path.includes(':') && meta.public !== false)
    .map(([path]) => path);
}
