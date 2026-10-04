import { describe, expect, it } from 'vitest';

import {
  aggregateSeasonStats,
  formatToPar,
  summarizeLeaderboard,
} from './seasonStats.mjs';

// Build a GolfBox-style round of 18 par 4s, with the given strokes on the
// first holes and pars on the rest.
function makeRound(number, firstHoles = [], { holes = 18, completed = true } = {}) {
  const HoleScores = {};
  for (let i = 0; i < holes; i++) {
    HoleScores[`H${i + 1}`] = { Par: 4, Score: { Value: firstHoles[i] ?? 4 } };
  }
  HoleScores['H-TOTAL'] = { Par: 72, Score: 72 };
  return { Number: number, IsCompleted: completed, HoleScores };
}

function makeEntry(id, rounds, extra = {}) {
  return {
    MemberID: `${id} `,
    FirstName: 'Player ',
    LastName: id,
    Rounds: Object.fromEntries(rounds.map(r => [`R${r.Number}`, r])),
    ...extra,
  };
}

function makeLeaderboard(entries, Cut) {
  return {
    Classes: {
      C1: {
        Cut,
        Leaderboard: {
          Entries: Object.fromEntries(entries.map((e, i) => [`E${i}`, e])),
        },
      },
    },
  };
}

describe('summarizeLeaderboard', () => {
  it('sums rounds from hole scores and counts birdies, eagles and aces', () => {
    const summary = summarizeLeaderboard(
      makeLeaderboard([
        makeEntry('a', [makeRound(1, [3, 3, 2, 1]), makeRound(2, [5])]),
      ]),
    );
    expect(summary).toEqual({
      rounds: 2,
      cutToPar: null,
      birdies: 2,
      eaglesOrBetter: 2,
      holeInOnes: 1,
      players: [
        {
          id: 'a',
          name: 'Player a',
          rounds: [
            { n: 1, strokes: 65, toPar: -7 },
            { n: 2, strokes: 73, toPar: 1 },
          ],
        },
      ],
    });
  });

  it('leaves out unfinished rounds but still counts their birdies', () => {
    const summary = summarizeLeaderboard(
      makeLeaderboard([
        makeEntry('a', [
          makeRound(1),
          makeRound(2, [3], { holes: 7, completed: false }),
        ]),
      ]),
    );
    expect(summary.players[0].rounds).toEqual([{ n: 1, strokes: 72, toPar: 0 }]);
    expect(summary.birdies).toBe(1);
    expect(summary.rounds).toBe(2);
  });

  it('finds the cut line from the players who played on', () => {
    const summary = summarizeLeaderboard(
      makeLeaderboard(
        [
          makeEntry('a', [makeRound(1, [3]), makeRound(2, [3]), makeRound(3)]),
          makeEntry('b', [makeRound(1, [5]), makeRound(2), makeRound(3)]),
          makeEntry('c', [makeRound(1, [6]), makeRound(2, [6])]),
        ],
        { IsPerformed: true, AfterRound: 2 },
      ),
    );
    expect(summary.cutToPar).toBe(1);
  });

  it('has no cut line when no cut was made or in stableford events', () => {
    const entries = [makeEntry('a', [makeRound(1), makeRound(2), makeRound(3)])];
    expect(
      summarizeLeaderboard(makeLeaderboard(entries, { IsPerformed: false }))
        .cutToPar,
    ).toBe(null);
    entries[0].ResultSum = { ToParText: '+4p' };
    expect(
      summarizeLeaderboard(
        makeLeaderboard(entries, { IsPerformed: true, AfterRound: 2 }),
      ).cutToPar,
    ).toBe(null);
  });

  it('is empty for competitions without individual entries', () => {
    expect(summarizeLeaderboard({ CompetitionData: {} }).players).toEqual([]);
    expect(
      summarizeLeaderboard({ Classes: { C1: { Leaderboard: { Teams: {} } } } })
        .players,
    ).toEqual([]);
  });
});

function makeItem(name, start, players, extra = {}) {
  return {
    competition: { name, slug: name, venue: `${name} GK`, start },
    data: {
      rounds: 3,
      cutToPar: null,
      birdies: 10,
      eaglesOrBetter: 2,
      holeInOnes: 1,
      players: players.map(([id, ...strokes]) => ({
        id,
        name: id,
        rounds: strokes.map((s, i) => ({ n: i + 1, strokes: s, toPar: s - 72 })),
      })),
      ...extra,
    },
  };
}

describe('aggregateSeasonStats', () => {
  const items = [
    makeItem(
      'one',
      '2026-05-01',
      [
        ['a', 70, 70, 64],
        ['b', 66, 66, 72],
        ['c', 60, 80], // missed the cut
      ],
      { cutToPar: 2 },
    ),
    makeItem(
      'two',
      '2026-06-01',
      [
        ['a', 70, 70, 66],
        ['b', 68, 68, 70],
      ],
      { cutToPar: -1 },
    ),
    makeItem('team event', '2026-07-01', []),
  ];
  const stats = aggregateSeasonStats(items);

  it('adds up the totals and averages the cut', () => {
    expect(stats.competitions).toBe(2);
    expect(stats.birdies).toBe(20);
    expect(stats.eaglesOrBetter).toBe(4);
    expect(stats.holeInOnes).toBe(2);
    expect(stats.cut).toEqual({ averageToPar: 0.5, competitions: 2 });
  });

  it('ranks scoring average among players with enough rounds', () => {
    expect(stats.scoringAverage.minRounds).toBe(3);
    expect(stats.scoringAverage.players.map(p => p.playerId)).toEqual(['a', 'b']);
    expect(stats.scoringAverage.players[0]).toEqual({
      playerId: 'a',
      name: 'a',
      rounds: 6,
      average: 410 / 6,
    });
  });

  it('ranks final-round average on last rounds only', () => {
    expect(stats.finalRoundAverage.players).toEqual([
      { playerId: 'a', name: 'a', rounds: 2, average: 65 },
      { playerId: 'b', name: 'b', rounds: 2, average: 71 },
    ]);
  });

  it('picks the lowest round with its competition', () => {
    const { playerId, strokes, toPar, round, competition } = stats.lowestRound;
    expect([playerId, strokes, toPar, round, competition.name]).toEqual([
      'c', 60, -12, 1, 'one',
    ]);
  });

  it('returns null when no competition has data', () => {
    expect(aggregateSeasonStats([])).toBe(null);
    expect(aggregateSeasonStats([makeItem('team', '2026-07-01', [])])).toBe(null);
  });
});

describe('formatToPar', () => {
  it('formats whole and fractional values', () => {
    expect(formatToPar(0)).toBe('E');
    expect(formatToPar(2)).toBe('+2');
    expect(formatToPar(-11)).toBe('−11');
    expect(formatToPar(1.75, 1)).toBe('+1.8');
    expect(formatToPar(-0.68, 1)).toBe('−0.7');
    expect(formatToPar(-0.04, 1)).toBe('E');
  });
});
