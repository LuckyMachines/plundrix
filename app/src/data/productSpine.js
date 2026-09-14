export const PRODUCT_STATEMENT =
  'Plundrix is a short-session vault-heist strategy game where players Pick, Search, Sabotage, and replay the table drama.';

export const CANONICAL_TERMS = Object.freeze([
  ['Operation', 'A game instance.'],
  ['Round', 'One action cycle.'],
  ['Vault', 'The shared objective.'],
  ['Operator', 'A player at the table.'],
  ['Tool', 'A bonus found by searching the vault.'],
  ['Sabotage', 'A turn action that can slow a rival operator.'],
  ['Replay', 'A round-by-round record of what happened in a match.'],
]);

export const CTA_VERBS = Object.freeze(['Play', 'Pick', 'Search', 'Sabotage', 'Replay', 'Compare', 'Review', 'Watch', 'Run', 'Import', 'Decide', 'Assemble', 'Equip']);

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
    route: '/play',
    summary: 'Start an instant vault race.',
  },
  {
    id: 'craft',
    label: 'Craft',
    route: '/workshop',
    summary: 'Turn match salvage into a personal gadget.',
  },
  {
    id: 'run',
    label: 'Run',
    route: '/vault-run',
    summary: 'Carry one gadget through three escalating vaults.',
  },
  {
    id: 'replay',
    label: 'Replay',
    route: '/replays',
    summary: 'Review the turns that changed a match.',
  },
  {
    id: 'live',
    label: 'Live',
    route: '/#live-operations',
    summary: 'Join a hosted multiplayer table.',
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
    label: 'Player Hub',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'play',
    purpose: 'Choose instant play or enter a live Plundrix operation.',
    title: 'Plundrix Player Hub - Choose Your Table',
    description: 'Play instantly against three agents or join a hosted live multiplayer operation.',
    image: '/images/og/plundrix-home.jpg',
    imageAlt: 'Plundrix Player Hub with Instant Play, Vault Run, and live table choices',
    primaryCta: 'Play',
    nextRoutes: ['/play', '/replays'],
  },
  '/play': {
    label: 'Instant Play',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'live',
    purpose: 'Start a Plundrix vault race instantly.',
    title: 'Play Plundrix Instantly',
    description: 'Start a fast Plundrix vault race against three labeled tactical agents. Choose Pick, Search, or Sabotage with no signup.',
    image: '/images/og/plundrix-play.jpg',
    imageAlt: 'Plundrix Instant Play showing the shared Pick, Search, and Sabotage interface',
    primaryCta: 'Play',
    nextRoutes: ['/workshop', '/replays'],
  },
  '/vault-run': {
    label: 'Vault Run',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'run',
    purpose: 'Take one gadget through three escalating practice vaults.',
    title: 'Vault Run - Three Vault Roguelite | Plundrix',
    description: 'Choose risky routes, outwit persistent rivals, and carry one workshop gadget through a three-stage Plundrix run.',
    image: '/images/og/plundrix-play.jpg',
    imageAlt: 'Plundrix Vault Run using the shared vault-race gameplay interface',
    primaryCta: 'Run',
    nextRoutes: ['/workshop', '/replays'],
  },
  '/career': {
    label: 'Career',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'replay',
    purpose: 'Review local identity, results, rivals, runs, collection, and next objectives.',
    title: 'Local Operator Career | Plundrix',
    description: 'Review your local Plundrix identity, operations, rivals, collection, Vault Runs, replays, and next objectives.',
    primaryCta: 'Review',
    nextRoutes: ['/play', '/workshop', '/vault-run'],
  },
  '/workshop': {
    label: 'Workshop',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'craft',
    purpose: 'Assemble and equip modular practice gadgets from earned salvage.',
    title: 'Operator Workshop - 10 Signature Gadgets, 1,200 Builds | Plundrix',
    description: 'Choose one of ten gameplay-distinct gadgets, then assemble a visible material and calibration configuration for your next Plundrix operation.',
    image: '/images/og/plundrix-play.jpg',
    imageAlt: 'Plundrix gameplay with modular vault tools and tactical actions',
    primaryCta: 'Assemble',
    nextRoutes: ['/play', '/replays'],
  },
  '/trailer': {
    label: 'Trailer',
    navGroup: 'Play',
    routeClass: 'marketing',
    loopStep: 'observe',
    purpose: 'Show a complete Plundrix match in motion.',
    title: 'Plundrix Gameplay Trailer - 32 Seconds',
    description: 'Watch a four-player vault race swing from first move to final lock in 32 seconds.',
    image: '/images/og/plundrix-trailer.jpg',
    imageAlt: 'Plundrix gameplay trailer showing a four-operator vault race',
    primaryCta: 'Watch',
    nextRoutes: ['/play', '/replays'],
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
  '/profile/:operatorId': {
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
    public: false,
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
    public: false,
  },
  '/replays': {
    label: 'Replays',
    navGroup: 'Play',
    routeClass: 'game',
    loopStep: 'replay',
    purpose: 'Remember and inspect dramatic operations.',
    title: 'Stories from the vault',
    description: 'Watch dramatic operations, close finishes, and the turns players still argue about.',
    primaryCta: 'Review',
    nextRoutes: ['/play', '/sessions'],
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
    nextRoutes: ['/replays', '/play'],
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
    public: false,
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
    public: false,
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
    description: 'Compare Plundrix with raid games, online board games, sabotage games, and session strategy games.',
    primaryCta: 'Compare',
    nextRoutes: ['/', '/map'],
    public: false,
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
    public: false,
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
    label: 'Design System',
    navGroup: 'Reference',
    routeClass: 'reference',
    loopStep: 'play',
    purpose: 'Review and govern the complete game interface.',
    title: 'Plundrix Design System',
    description: 'Review Plundrix foundations, components, gameplay states, responsive patterns, assets, voice, accessibility, and system-wide coverage.',
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
    description: 'Terms of Service for Plundrix, including eligibility, game modes, hosted processing, and beta posture.',
    primaryCta: 'Review',
    nextRoutes: ['/privacy'],
  },
  '/privacy': {
    label: 'Privacy',
    navGroup: 'Reference',
    routeClass: 'legal',
    purpose: 'State the privacy policy.',
    title: 'Plundrix Privacy Policy',
    description: 'Privacy Policy for Plundrix, including data handling, managed player sessions, analytics, and service operations.',
    primaryCta: 'Review',
    nextRoutes: ['/terms'],
  },
});

export const ROUTE_DISCOVERY = Object.freeze({
  '/': {
    summary: 'Choose Instant Play for a complete browser match against three tactical agents, start a three-vault solo run, or enter a hosted live table. All three modes use the same Pick, Search, and Sabotage decision interface.',
    highlights: ['Complete matches with a real ending', 'One shared ruleset across solo and live play', 'No signup required for Instant Play'],
  },
  '/play': {
    summary: 'Instant Play starts a complete Plundrix match against three clearly labeled tactical agents. Every round, all four operators secretly choose Pick, Search, or Sabotage and reveal together.',
    highlights: ['Pick attempts the next vault lock', 'Search builds tools and future odds', 'Sabotage disrupts a chosen rival'],
  },
  '/vault-run': {
    summary: 'Vault Run carries one equipped gadget through three escalating practice vaults. Route choices change heat and rewards while persistent rivals remember the run.',
    highlights: ['Three-stage solo run', 'Branching risk and reward routes', 'Persistent gadget and contraband choices'],
  },
  '/career': {
    summary: 'Career turns completed play on this device into a compact operator record with rival history, collection progress, Vault Run results, and a clear next objective.',
    highlights: ['Local progress without an account', 'Rival and replay history', 'Next objective based on completed play'],
  },
  '/workshop': {
    summary: 'The Workshop contains ten gameplay-distinct gadget chassis and 1,200 deterministic builds assembled from visible materials, finishes, and calibrations.',
    highlights: ['Ten signature gadget chassis', '1,200 stable blueprint combinations', 'Equip one build for the next operation'],
  },
  '/trailer': {
    summary: 'The 32-second Plundrix gameplay trailer uses real product captures to show the vault race, simultaneous reveal, tactical tools, sabotage, and final breach.',
    highlights: ['Real gameplay captures', 'Complete match arc in 32 seconds', 'Instant Play available after the trailer'],
  },
  '/leaderboard': {
    summary: 'The operator ladder shows available competitive standings and labels the source and unavailable state instead of inventing player activity.',
    highlights: ['Current operator standings', 'Labeled data source', 'Honest unavailable state'],
  },
  '/sessions': {
    summary: 'Operation History exposes available public match records with operator results and session context, plus a clear unavailable state when the feed cannot be reached.',
    highlights: ['Recent public operation records', 'Operator and result context', 'Transparent service state'],
  },
  '/replays': {
    summary: 'Stories from the Vault collects deterministic replay records that explain the round, action, and consequence behind a close finish or table-changing turn.',
    highlights: ['Round-by-round operation records', 'Curated turning points', 'Direct path back into Instant Play'],
  },
  '/glossary': {
    summary: 'The Plundrix glossary defines the current game language for operations, rounds, vaults, operators, tools, sabotage, and replays.',
    highlights: ['Current rules terminology', 'Plain-language definitions', 'Links back to playable modes'],
  },
  '/terms': {
    summary: 'The game terms explain eligibility, playable beta behavior, hosted processing, acceptable use, and the current service posture.',
    highlights: ['Versioned service terms', 'Plain-language beta posture', 'Hosted game responsibilities'],
  },
  '/privacy': {
    summary: 'The privacy notice explains local preferences, anonymous product analytics, managed player sessions, and the controls available to players.',
    highlights: ['Local preference storage', 'Anonymous aggregate analytics', 'Player controls and contact details'],
  },
});

export function routeMeta(path) {
  return ROUTE_META[path] || null;
}

export function routeDiscovery(path) {
  return ROUTE_DISCOVERY[path] || null;
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
