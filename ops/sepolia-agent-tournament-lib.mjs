export const TOURNAMENT_AGENTS = Object.freeze([
  {
    id: 'adaptive',
    name: 'The Operator',
    description: 'Builds tools, converts strong odds, and disrupts a rival at match point.',
  },
  {
    id: 'lock-rusher',
    name: 'Lock Rusher',
    description: 'Picks relentlessly and accepts weak odds for maximum race pressure.',
  },
  {
    id: 'tool-hoarder',
    name: 'Tool Hoarder',
    description: 'Builds a two-tool stack before converting it into high-probability picks.',
  },
  {
    id: 'leader-hunter',
    name: 'Leader Hunter',
    description: 'Targets breakaways, then searches or picks when the race is compressed.',
  },
  {
    id: 'saboteur',
    name: 'Saboteur',
    description: 'Disrupts material threats, then builds and converts its own finishing position.',
  },
]);

export const ACTION = Object.freeze({ PICK: 1, SEARCH: 2, SABOTAGE: 3 });
export const ACTION_NAME = Object.freeze({ 1: 'PICK', 2: 'SEARCH', 3: 'SABOTAGE' });

function decision(action, rationale, targetOpponent = false) {
  return { action, actionName: ACTION_NAME[action], rationale, targetOpponent };
}

export function chooseAgentAction(agentId, { self, opponent, round, totalLocks = 5 }) {
  const matchPoint = self.locks >= totalLocks - 1;
  const rivalMatchPoint = opponent.locks >= totalLocks - 1;

  if (
    round >= 9
    && ['adaptive', 'tool-hoarder', 'leader-hunter', 'saboteur'].includes(agentId)
  ) {
    return self.tools > 0
      ? decision(ACTION.PICK, 'Late-game conversion forbids another disruption cycle.')
      : decision(ACTION.SEARCH, 'Late-game recovery forbids another disruption cycle.');
  }

  switch (agentId) {
    case 'lock-rusher':
      return decision(ACTION.PICK, 'Push lock progress every round, regardless of inventory.');

    case 'tool-hoarder':
      if (matchPoint && !self.stunned) {
        return decision(ACTION.PICK, 'Cash in the tool stack at match point.');
      }
      if (self.stunned && opponent.locks > self.locks) {
        return decision(ACTION.SABOTAGE, 'Use a guaranteed disruption while stunned.', true);
      }
      if (self.tools < 2) {
        return decision(ACTION.SEARCH, 'Build the two-tool conversion stack.');
      }
      return decision(ACTION.PICK, 'Convert the completed tool stack into lock progress.');

    case 'leader-hunter':
      if (rivalMatchPoint || (opponent.locks >= self.locks + 2 && opponent.tools > 0)) {
        return decision(ACTION.SABOTAGE, 'Disrupt a rival with a decisive lock lead.', true);
      }
      if (self.stunned && opponent.locks >= self.locks + 2) {
        return decision(ACTION.SABOTAGE, 'Trade the stunned round for guaranteed disruption.', true);
      }
      if (self.tools < 2) {
        return decision(ACTION.SEARCH, 'Build a credible conversion position before advancing.');
      }
      return decision(ACTION.PICK, 'Advance while the race remains compressed.');

    case 'saboteur':
      if (matchPoint && !self.stunned) {
        return decision(ACTION.PICK, 'Close the operation instead of over-disrupting.');
      }
      if (opponent.tools >= 2 || opponent.locks >= self.locks + 2) {
        return decision(ACTION.SABOTAGE, 'Disrupt only a material inventory or lock threat.', true);
      }
      if (self.stunned && (opponent.tools > 0 || opponent.locks > self.locks)) {
        return decision(ACTION.SABOTAGE, 'Trade the stunned round for targeted counter-pressure.', true);
      }
      if (self.tools < 2) {
        return decision(ACTION.SEARCH, 'Build an independent finishing position before applying pressure.');
      }
      return decision(ACTION.PICK, 'Convert stored leverage instead of extending the disruption cycle.');

    case 'adaptive':
    default:
      if (matchPoint && !self.stunned) {
        return decision(ACTION.PICK, 'One successful pick wins the operation.');
      }
      if (rivalMatchPoint || (self.stunned && opponent.locks > self.locks)) {
        return decision(ACTION.SABOTAGE, 'Stop the leading rival while direct progress is weak.', true);
      }
      if (self.tools < 2) {
        return decision(ACTION.SEARCH, 'Improve weak pick odds before committing.');
      }
      return decision(ACTION.PICK, 'Convert a useful tool position into lock progress.');
  }
}

export function buildTournamentSchedule(repetitionsPerPair = 5) {
  if (!Number.isInteger(repetitionsPerPair) || repetitionsPerPair < 1) {
    throw new Error('repetitionsPerPair must be a positive integer');
  }
  const schedule = [];
  for (let left = 0; left < TOURNAMENT_AGENTS.length; left += 1) {
    for (let right = left + 1; right < TOURNAMENT_AGENTS.length; right += 1) {
      const pair = [TOURNAMENT_AGENTS[left].id, TOURNAMENT_AGENTS[right].id];
      for (let repetition = 1; repetition <= repetitionsPerPair; repetition += 1) {
        const cyclicLeftFirst = ((right - left) % TOURNAMENT_AGENTS.length) <= 2;
        const baseFirst = repetition <= Math.ceil(repetitionsPerPair / 2);
        const leftFirst = baseFirst ? cyclicLeftFirst : !cyclicLeftFirst;
        const seatA = leftFirst ? pair[0] : pair[1];
        const seatB = leftFirst ? pair[1] : pair[0];
        schedule.push({ index: schedule.length + 1, pairing: `${pair[0]}-vs-${pair[1]}`, repetition, seatA, seatB });
      }
    }
  }
  return schedule;
}

export function summarizeTournament(report) {
  const standings = Object.fromEntries(TOURNAMENT_AGENTS.map((agent) => [agent.id, {
    ...agent,
    games: 0,
    wins: 0,
    losses: 0,
    rounds: 0,
    actions: { PICK: 0, SEARCH: 0, SABOTAGE: 0 },
  }]));
  for (const game of report.games.filter(({ status }) => status === 'complete')) {
    for (const seat of ['seatA', 'seatB']) {
      const id = game[seat].agentId;
      const row = standings[id];
      row.games += 1;
      row.rounds += game.roundCount;
      if (game.winnerAgentId === id) row.wins += 1;
      else row.losses += 1;
    }
    for (const round of game.rounds) {
      standings[game.seatA.agentId].actions[round.seatA.actionName] += 1;
      standings[game.seatB.agentId].actions[round.seatB.actionName] += 1;
    }
  }
  return Object.values(standings)
    .map((row) => ({
      ...row,
      winRate: row.games ? row.wins / row.games : 0,
      averageRounds: row.games ? row.rounds / row.games : 0,
    }))
    .sort((left, right) => right.winRate - left.winRate || left.name.localeCompare(right.name));
}

export function renderTournamentMarkdown(report) {
  const completeGames = report.games.filter(({ status }) => status === 'complete');
  const standings = summarizeTournament(report);
  const totalRounds = completeGames.reduce((sum, game) => sum + game.roundCount, 0);
  const totalGas = completeGames.reduce(
    (sum, game) => sum + game.transactions.reduce((gameSum, tx) => gameSum + BigInt(tx.gasUsed || 0), 0n),
    0n,
  );
  const lines = [
    '# Plundrix Sepolia Agent Tournament',
    '',
    `Generated: ${report.updatedAt}`,
    '',
    `- Run: \`${report.runId}\``,
    `- Strategy version: \`${report.strategyVersion}\``,
    `- Network: Sepolia (${report.chainId})`,
    `- Contract: \`${report.contractAddress}\``,
    `- Completed games: ${completeGames.length}/${report.targetGames}`,
    `- Total rounds: ${totalRounds}`,
    `- Average rounds per completed game: ${completeGames.length ? (totalRounds / completeGames.length).toFixed(2) : '0.00'}`,
    `- Confirmed gas used: ${totalGas}`,
    '',
    '## Standings',
    '',
    '| Rank | Agent | Games | Wins | Losses | Win rate | Avg rounds | Pick | Search | Sabotage |',
    '|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...standings.map((row, index) => `| ${index + 1} | ${row.name} | ${row.games} | ${row.wins} | ${row.losses} | ${(row.winRate * 100).toFixed(1)}% | ${row.averageRounds.toFixed(2)} | ${row.actions.PICK} | ${row.actions.SEARCH} | ${row.actions.SABOTAGE} |`),
    '',
    '## Strategy roster',
    '',
    ...TOURNAMENT_AGENTS.map((agent) => `- **${agent.name}** (\`${agent.id}\`): ${agent.description}`),
    '',
    '## Games',
    '',
    '| # | Onchain game | Seat A | Seat B | Winner | Rounds | Final transaction |',
    '|---:|---:|---|---|---|---:|---|',
    ...report.games.map((game) => `| ${game.scheduleIndex} | ${game.gameId || '-'} | ${game.seatA.agentId} | ${game.seatB.agentId} | ${game.winnerAgentId || game.status} | ${game.roundCount || '-'} | ${game.transactions.at(-1)?.hash || '-'} |`),
    '',
    '## Method and limitations',
    '',
    '- Every match is a FREE onchain game using the same two disclosed HSM-backed player wallets; agent identity is the strategy assigned to a seat, not a separate wallet identity.',
    '- All actions, external entropy submissions, and resolutions are real Sepolia transactions with confirmed receipts.',
    '- Pairings use every two-agent combination five times. Seat assignment is balanced by the deterministic scheduler.',
    '- Results measure these fixed policies under live contract randomness. They are not human-playtest evidence and do not imply financial value.',
    '',
  ];
  return `${lines.join('\n')}\n`;
}
