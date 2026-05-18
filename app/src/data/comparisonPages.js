export const SITE_ORIGIN = 'https://game.plundrix.com';

export const COMPARISON_PAGES = Object.freeze([
  {
    slug: 'coin-master-alternative',
    competitor: 'Coin Master',
    category: 'Raid and attack games',
    eyebrow: 'Raid game alternative',
    title: 'Plundrix vs Coin Master',
    metaTitle: 'Coin Master Alternative: Plundrix for Turn-Based Vault Raids',
    metaDescription: 'Looking for a Coin Master alternative with more turn-by-turn agency? Compare raid-and-attack loops with Plundrix vault races, sabotage, and replayable decisions.',
    headline: 'A Coin Master alternative for players who want the raid to be a decision, not just a spin.',
    summary: 'Coin Master is built around raids, attacks, village progression, and social pressure. Plundrix keeps the loot-race fantasy but turns it into a compact multiplayer vault contest where each round asks players to pick a lock, search for tools, or sabotage the table.',
    bestFor: [
      'Players who like raid-and-attack tension but want direct tactical choices.',
      'Groups that want fast table drama without a long campaign setup.',
      'Searchers looking for a loot game with visible match outcomes and replay proof.',
    ],
    notFor: [
      'Players who mainly want slot-machine progression.',
      'Players looking for a huge village-building collection loop.',
    ],
    plundrixAdvantages: [
      'Every round centers on a visible decision: Pick, Search, or Sabotage.',
      'Sabotage is part of the match state, not only a background social action.',
      'Replay and simulator tools make dramatic outcomes inspectable after the match.',
      'Explicit bot and agent labeling helps clarify who is playing at the table.',
    ],
    compareRows: [
      ['Core loop', 'Spin, raid, attack, and upgrade villages.', 'Choose vault actions, pressure opponents, and race to crack locks.'],
      ['Agency', 'Progress is strongly tied to spin and event cadence.', 'Progress comes from turn timing, tools, sabotage, and risk decisions.'],
      ['Session feel', 'Casual progression over repeated visits.', 'Short competitive board-game sessions with a clear winner.'],
      ['Social pressure', 'Friends can be attacked or raided.', 'Players can directly stun and disrupt rivals during the match.'],
    ],
    faq: [
      ['Is Plundrix the same kind of game as Coin Master?', 'No. The overlap is player intent: raids, attacks, loot tension, and social pressure. Plundrix is a turn-based vault-race strategy game.'],
      ['Why would a Coin Master player try Plundrix?', 'Because Plundrix makes the heist moment tactical. You decide when to build tools, when to pick, and when to sabotage another player.'],
      ['Does Plundrix have village progression?', 'No. Plundrix focuses on session-based vault races, ladders, replay proof, and competitive table outcomes.'],
    ],
    sourceLinks: [
      { label: 'Coin Master attacks support page', href: 'https://support.coinmastergame.com/hc/en-us/articles/360001264874-What-are-attacks-' },
      { label: 'Coin Master raids support page', href: 'https://support.coinmastergame.com/hc/en-us/articles/360001257933-What-are-Raids' },
    ],
  },
  {
    slug: 'monopoly-go-alternative',
    competitor: 'Monopoly GO',
    category: 'Casual heist and board games',
    eyebrow: 'Monopoly GO alternative',
    title: 'Plundrix vs Monopoly GO',
    metaTitle: 'Monopoly GO Alternative: Plundrix for Strategic Vault Heists',
    metaDescription: 'Compare Monopoly GO-style quick social heist energy with Plundrix, a short-session turn-based vault game with direct sabotage and strategic choices.',
    headline: 'A Monopoly GO alternative for players who want the heist energy with more table control.',
    summary: 'Monopoly GO wraps familiar board-game pacing in quick social events and heist moments. Plundrix leans into the vault fantasy directly: players race through locks, build tools, and disrupt rivals in a compact strategy match.',
    bestFor: [
      'Players who like quick social games but want direct action selection.',
      'Players who enjoy heist moments and table swings.',
      'Groups looking for a short competitive board-game session online.',
    ],
    notFor: [
      'Players looking for Monopoly property collection.',
      'Players who want a mostly idle or event-driven loop.',
    ],
    plundrixAdvantages: [
      'The board tension is compressed into one vault race.',
      'Every action has a readable tactical purpose.',
      'Sabotage, tools, and lock progress are visible to players.',
      'Replays can turn a close finish into shareable proof.',
    ],
    compareRows: [
      ['Core loop', 'Roll-driven progression, collections, and recurring events.', 'Turn-based vault actions with direct lock progress and sabotage.'],
      ['Heist fantasy', 'Heist events appear inside a broader Monopoly progression loop.', 'The full match is a vault heist from start to finish.'],
      ['Player control', 'Players react to rolls, events, and progression opportunities.', 'Players choose risk, tools, targets, and timing each round.'],
      ['Match outcome', 'Progress accumulates over time.', 'Each session resolves into a competitive winner.'],
    ],
    faq: [
      ['Is Plundrix a Monopoly game?', 'No. Plundrix is an original vault-heist strategy game. The comparison is for players seeking a quick social board-game alternative.'],
      ['Does Plundrix use dice rolls?', 'No. Plundrix centers on action choices: Pick, Search, and Sabotage.'],
      ['Why compare it to Monopoly GO?', 'Because the search intent overlaps: short sessions, social pressure, and heist-style moments.'],
    ],
    sourceLinks: [
      { label: 'Monopoly GO Bank Heist support page', href: 'https://monopolygo.helpshift.com/hc/en/3-monopoly-go/faq/122-bank-heist/' },
    ],
  },
  {
    slug: 'catan-online-alternative',
    competitor: 'CATAN',
    category: 'Digital strategy board games',
    eyebrow: 'CATAN alternative',
    title: 'Plundrix vs CATAN Online',
    metaTitle: 'CATAN Online Alternative: Plundrix for Short Heist Strategy',
    metaDescription: 'Looking for a CATAN online alternative? Compare resource-trading board-game strategy with Plundrix short-session vault races, tools, and sabotage.',
    headline: 'A CATAN alternative when you want board-game reads without a long settlement arc.',
    summary: 'CATAN rewards trading, building, expansion, and long-term resource timing. Plundrix keeps the table-read pressure but moves it into a shorter vault race where tools, sabotage, and lock pressure create the strategic arc.',
    bestFor: [
      'Board-game players who like reading opponents and timing resources.',
      'Players who want a shorter online strategy session.',
      'Groups that prefer tactical pressure over negotiation-heavy trading.',
    ],
    notFor: [
      'Players who mainly want trading negotiations.',
      'Players looking for map expansion and settlement placement.',
    ],
    plundrixAdvantages: [
      'Shorter sessions with a clearer tactical finish line.',
      'Tools create resource pressure without a full economic map.',
      'Sabotage gives players a direct answer to a runaway leader.',
      'Simulator-backed tuning helps inspect whether sessions are healthy.',
    ],
    compareRows: [
      ['Core loop', 'Trade resources, build roads and settlements, and expand.', 'Collect tools, crack locks, and disrupt rivals.'],
      ['Table politics', 'Negotiation and trade are central.', 'Target selection and sabotage create table reads.'],
      ['Pacing', 'Longer strategic arc.', 'Compact vault race designed for fast online sessions.'],
      ['Comeback tools', 'Resource trades and board position.', 'Search, sabotage, and timing around near-winners.'],
    ],
    faq: [
      ['Is Plundrix for CATAN players?', 'It can be, if they want shorter online strategy with visible table pressure and less negotiation.'],
      ['Does Plundrix have resource trading?', 'No. Tools are collected and used inside the vault race rather than traded across a settlement economy.'],
      ['What is the shared appeal?', 'Both ask players to read the table, time resources, and notice when another player is about to pull ahead.'],
    ],
    sourceLinks: [
      { label: 'Official CATAN site', href: 'https://www.catan.com/catan' },
    ],
  },
  {
    slug: 'risk-online-alternative',
    competitor: 'Risk: Global Domination',
    category: 'Online turn-based strategy',
    eyebrow: 'Risk alternative',
    title: 'Plundrix vs Risk Online',
    metaTitle: 'Risk Online Alternative: Plundrix for Short Turn-Based Strategy',
    metaDescription: 'Compare Risk-style turn-based competitive pressure with Plundrix, a shorter online vault-race strategy game with sabotage and replayable finishes.',
    headline: 'A Risk alternative for players who like turn pressure but not marathon map conquest.',
    summary: 'Risk is about territory, armies, and global conquest. Plundrix is about a tighter conflict: four players around one vault, each deciding when to advance, prepare, or interrupt another player.',
    bestFor: [
      'Players who like turn-based pressure and visible leader threats.',
      'Groups that want a shorter alternative to map conquest.',
      'Players who enjoy comeback windows and table disruption.',
    ],
    notFor: [
      'Players who want army placement and world-map conquest.',
      'Players who enjoy long alliance-driven strategy sessions.',
    ],
    plundrixAdvantages: [
      'The leader is readable by lock progress and tool state.',
      'Sabotage gives non-leaders a way to keep the race compressed.',
      'Matches resolve faster than traditional conquest games.',
      'Replay Director can preserve close finishes and swing turns.',
    ],
    compareRows: [
      ['Conflict shape', 'Territory control and army pressure.', 'Single-vault race with direct opponent disruption.'],
      ['Game length', 'Can run long depending on players and map state.', 'Designed around compact sessions and clear endings.'],
      ['Comebacks', 'Depend on board state, dice, cards, and alliances.', 'Depend on tools, sabotage timing, and final-lock pressure.'],
      ['Player target', 'Attack territories and continents.', 'Target lock progress, tool stacks, and near-winners.'],
    ],
    faq: [
      ['Is Plundrix a war game?', 'No. It is a vault-heist strategy game. The overlap is turn-based competition and leader pressure.'],
      ['Why would a Risk player care?', 'Plundrix gives a similar feeling of watching the board for runaway threats, but in a shorter session.'],
      ['Does Plundrix support online competition?', 'Yes. Plundrix is built around online sessions, leaderboards, and explicit bot/agent labeling.'],
    ],
    sourceLinks: [
      { label: 'Risk: Global Domination on Steam', href: 'https://store.steampowered.com/app/1128810/RISK_Global_Domination/' },
    ],
  },
  {
    slug: 'among-us-board-game-alternative',
    competitor: 'Among Us',
    category: 'Sabotage and social pressure',
    eyebrow: 'Sabotage game alternative',
    title: 'Plundrix vs Among Us',
    metaTitle: 'Among Us Alternative: Plundrix for Turn-Based Sabotage',
    metaDescription: 'Want sabotage without hidden-role voice-chat chaos? Compare Among Us-style suspicion with Plundrix turn-based vault races and visible disruption.',
    headline: 'An Among Us alternative when you want sabotage without depending on voice-chat deception.',
    summary: 'Among Us creates tension through hidden roles, suspicion, and sabotage. Plundrix makes disruption public and tactical: players can sabotage rivals in the open, then everyone has to react to the changed vault state.',
    bestFor: [
      'Players who like sabotage but want clearer board-game state.',
      'Groups that prefer turn-based decisions over real-time deception.',
      'Players who want disruption without requiring voice chat.',
    ],
    notFor: [
      'Players who specifically want hidden impostor deduction.',
      'Players looking for real-time movement and emergency meetings.',
    ],
    plundrixAdvantages: [
      'Sabotage is visible and mechanically inspectable.',
      'The target of disruption is clear at the table.',
      'Turn-based pacing gives players time to understand the state.',
      'Replays can show whether a sabotage swing actually changed the match.',
    ],
    compareRows: [
      ['Sabotage style', 'Hidden-role sabotage and suspicion.', 'Open tactical sabotage inside a vault race.'],
      ['Social layer', 'Discussion, deception, and deduction.', 'Table reads, target choice, and visible pressure.'],
      ['Pacing', 'Real-time movement and meetings.', 'Turn-based rounds.'],
      ['Best moment', 'Finding or fooling the group.', 'Stunning a near-winner or timing a final lock push.'],
    ],
    faq: [
      ['Does Plundrix have impostors?', 'No. All players are vault racers. Sabotage is a tactical action, not a hidden role.'],
      ['Is Plundrix social deduction?', 'No. It has social pressure and targeting, but the core game is turn-based strategy.'],
      ['Why compare Plundrix to Among Us?', 'Because some players want sabotage and table drama without voice-chat deception.'],
    ],
    sourceLinks: [
      { label: 'Among Us official site', href: 'https://www.innersloth.com/games/among-us/' },
    ],
  },
  {
    slug: 'munchkin-alternative',
    competitor: 'Munchkin',
    category: 'Backstabbing board and card games',
    eyebrow: 'Backstabbing game alternative',
    title: 'Plundrix vs Munchkin',
    metaTitle: 'Munchkin Alternative: Plundrix for Fast Digital Backstabbing',
    metaDescription: 'Looking for a Munchkin alternative online? Compare backstabbing card-game energy with Plundrix vault races, sabotage, tools, and replayable table drama.',
    headline: 'A Munchkin alternative for players who want backstabbing energy in a faster digital vault race.',
    summary: 'Munchkin is loved for opportunistic table interference and comic betrayal. Plundrix channels a similar appetite for disruption into a short digital strategy match where sabotage and tools decide who reaches the final lock first.',
    bestFor: [
      'Players who enjoy interfering with friends at exactly the wrong moment.',
      'Groups that want backstabbing without a long card-game rules teach.',
      'Players who like table drama with a cleaner digital state.',
    ],
    notFor: [
      'Players who mainly want card combos and fantasy parody.',
      'Players looking for a physical tabletop card-game experience.',
    ],
    plundrixAdvantages: [
      'Backstabbing is represented by concrete sabotage actions.',
      'The vault state makes leader pressure visible.',
      'Digital sessions reduce bookkeeping and cleanup.',
      'Replay proof preserves the swing turn everyone argues about afterward.',
    ],
    compareRows: [
      ['Conflict style', 'Card-driven interference and table negotiation.', 'Action-driven sabotage and lock pressure.'],
      ['Theme', 'Fantasy parody and dungeon loot.', 'Vault heist, tools, locks, and rival crews.'],
      ['Session shape', 'Physical or digital card-game arc.', 'Short online vault race.'],
      ['Drama source', 'Helping and hurting at key card moments.', 'Stuns, tool swings, and final-lock timing.'],
    ],
    faq: [
      ['Is Plundrix a card game?', 'No. It is a digital turn-based vault game. The comparison is about backstabbing table energy.'],
      ['Can players gang up on a leader?', 'Yes. Sabotage and target choice let players pressure near-winners.'],
      ['Why would Munchkin players try Plundrix?', 'Because it offers a faster digital way to create betrayals, reversals, and table stories.'],
    ],
    sourceLinks: [
      { label: 'Official Munchkin site', href: 'https://munchkin.game/products/games/munchkin/' },
    ],
  },
  {
    slug: 'onchain-board-game',
    competitor: 'Traditional online board games',
    category: 'Onchain board games',
    eyebrow: 'Onchain board game',
    title: 'Plundrix as an Onchain Board Game',
    metaTitle: 'Onchain Board Game: Plundrix Vault Strategy on Blockchain Rails',
    metaDescription: 'Plundrix is an onchain board-game-like vault race with short sessions, visible sabotage, replay proof, leaderboards, and explicit bot/agent play.',
    headline: 'An onchain board game built around short vault races, not a sprawling economy.',
    summary: 'Plundrix is closest to a compact online board game: players join a table, make turn-based action choices, pressure the leader, and finish with a visible winner. The onchain layer gives the session a durable game record while the simulator and replay systems keep the design inspectable.',
    bestFor: [
      'Players looking for a blockchain game with readable match structure.',
      'Board-game fans who want short online sessions.',
      'Builders interested in simulator-backed onchain game operations.',
    ],
    notFor: [
      'Players looking for passive yield or financialized progression.',
      'Players who want a massive open-world economy.',
    ],
    plundrixAdvantages: [
      'Onchain sessions are paired with normal game UX and route-level launch checks.',
      'The simulator, Ghosts, and Rule Mutation tools use the same engine vocabulary.',
      'Bot and agent play is treated as a disclosed product surface.',
      'Replay Director makes match outcomes shareable and reviewable.',
    ],
    compareRows: [
      ['Primary promise', 'Usually classic board-game recreation or abstract web3 utility.', 'Original short-session vault-heist strategy.'],
      ['Player action', 'Depends on the game.', 'Pick, Search, Sabotage, and table targeting.'],
      ['Operations layer', 'Often separate from player-facing game.', 'Launch Copilot, Oracle, simulator, playtest, and replay systems are integrated.'],
      ['Bot posture', 'Often implicit or unmanaged.', 'Agent and bot participation is labeled as part of the product.'],
    ],
    faq: [
      ['Is Plundrix fully onchain?', 'Plundrix uses blockchain rails for game sessions and contract interaction, while the frontend, simulator, replay, and ops tools support the player experience.'],
      ['Is Plundrix gambling?', 'The current public posture is free-play beta. The app includes terms, launch checks, and release gates around production readiness.'],
      ['Why call it an onchain board game?', 'Because the session shape is table-based, turn-based, and stateful, with an onchain game record and board-game-like player decisions.'],
    ],
    sourceLinks: [
      { label: 'Plundrix developer docs', href: 'https://github.com/LuckyMachines/plundrix/tree/main/docs/dev' },
    ],
  },
  {
    slug: 'pirate-nation-alternative',
    competitor: 'Pirate Nation',
    category: 'Onchain games',
    eyebrow: 'Pirate Nation alternative',
    title: 'Plundrix vs Pirate Nation',
    metaTitle: 'Pirate Nation Alternative: Plundrix for Session-Based Onchain Strategy',
    metaDescription: 'Compare Pirate Nation-style onchain game interest with Plundrix, a shorter session-based vault race with sabotage, replay proof, and simulator-backed tuning.',
    headline: 'A Pirate Nation alternative for players who want session-based onchain table competition.',
    summary: 'Pirate Nation represents a broader onchain RPG and progression direction. Plundrix is narrower by design: short competitive vault sessions, readable sabotage, leaderboards, replay proof, and operational tools for tuning the game.',
    bestFor: [
      'Players curious about onchain games but wanting a shorter session loop.',
      'Competitive players who prefer a clear match winner.',
      'Builders who want to see game design evidence tied to simulator and launch tools.',
    ],
    notFor: [
      'Players seeking a broad RPG progression economy.',
      'Players who want pirate-themed worldbuilding specifically.',
    ],
    plundrixAdvantages: [
      'Compact turn-based matches with explicit win conditions.',
      'A tactical sabotage layer for direct player interaction.',
      'Replay and Ghost systems that help inspect match quality.',
      'Launch and Oracle tooling that makes readiness visible.',
    ],
    compareRows: [
      ['Scope', 'Broader pirate RPG/progression world.', 'Focused vault-race table sessions.'],
      ['Session promise', 'Progression through a larger game economy.', 'Fast competitive matches with a visible winner.'],
      ['Interaction style', 'Adventure/progression oriented.', 'Pick, Search, Sabotage, and leader pressure.'],
      ['Design operations', 'Onchain game infrastructure focus.', 'Simulator, ghosts, replay, mutation, playtest, and launch gates around one engine.'],
    ],
    faq: [
      ['Is Plundrix a Pirate Nation clone?', 'No. Plundrix is a vault-heist board-game-like strategy session. The comparison is for onchain-game searchers.'],
      ['Which is more competitive?', 'Plundrix is explicitly centered on short competitive sessions and leaderboard-ready outcomes.'],
      ['Why compare onchain games at all?', 'Because players often search by ecosystem and technology posture before they know the exact game format they want.'],
    ],
    sourceLinks: [
      { label: 'Pirate Nation technology docs', href: 'https://docs.piratenation.game/learn/about-our-tech' },
    ],
  },
]);

export const COMPARISON_BY_SLUG = Object.freeze(
  Object.fromEntries(COMPARISON_PAGES.map((page) => [page.slug, page])),
);

export function comparisonUrl(slug) {
  return `/compare/${slug}`;
}

export function absoluteComparisonUrl(slug) {
  return `${SITE_ORIGIN}${comparisonUrl(slug)}`;
}
