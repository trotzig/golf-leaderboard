import { isStablefordText } from './competitionFormat.mjs';

const TOP_COUNT = 3;

// Sum up one round from its hole scores. We count raw strokes (Score.Value)
// rather than trusting ResultSum, which is in points for stableford events.
// Returns undefined unless all 18 holes have a score.
function summarizeRound(round) {
  if (!round.IsCompleted || !round.HoleScores) {
    return undefined;
  }
  let strokes = 0;
  let par = 0;
  let holes = 0;
  for (const [key, hole] of Object.entries(round.HoleScores)) {
    if (!/^H\d+$/.test(key)) continue; // skip H-OUT, H-IN, H-TOTAL
    if (!isPlayedHole(hole)) return undefined;
    strokes += hole.Score.Value;
    par += hole.Par;
    holes += 1;
  }
  if (holes !== 18) {
    return undefined;
  }
  return { n: round.Number, strokes, toPar: strokes - par };
}

function isPlayedHole(hole) {
  return (
    hole &&
    typeof hole.Par === 'number' &&
    hole.Score &&
    typeof hole.Score.Value === 'number' &&
    hole.Score.Value > 0
  );
}

function hasStarted(round) {
  return Object.entries(round.HoleScores || {}).some(
    ([key, hole]) => /^H\d+$/.test(key) && isPlayedHole(hole),
  );
}

// The cut line is the worst total (to par) among the players who went on to
// play the round after the cut.
function getCutToPar(clazz, entries) {
  const afterRound = clazz.Cut && clazz.Cut.IsPerformed && clazz.Cut.AfterRound;
  if (!afterRound) {
    return null;
  }
  if (entries.some(e => isStablefordText(e.ResultSum && e.ResultSum.ToParText))) {
    // Stableford cuts are made on points, not strokes.
    return null;
  }
  let cutToPar = null;
  for (const entry of entries) {
    const rounds = Object.values(entry.Rounds || {});
    if (!rounds.some(r => r.Number === afterRound + 1 && hasStarted(r))) {
      continue;
    }
    const before = rounds
      .filter(r => r.Number <= afterRound)
      .map(summarizeRound);
    if (before.length !== afterRound || before.some(r => !r)) {
      continue;
    }
    const toPar = before.reduce((sum, r) => sum + r.toPar, 0);
    if (cutToPar === null || toPar > cutToPar) {
      cutToPar = toPar;
    }
  }
  return cutToPar;
}

// Boil a GolfBox leaderboard response down to the few numbers the season
// stats need. This is what we store per competition (CompetitionStats.data).
// Team and match play events have no individual entries and come out empty.
export function summarizeLeaderboard(json) {
  const result = {
    rounds: 0,
    cutToPar: null,
    birdies: 0,
    eaglesOrBetter: 0,
    holeInOnes: 0,
    players: [],
  };
  const clazz = json.Classes && Object.values(json.Classes)[0];
  if (!clazz || !clazz.Leaderboard || !clazz.Leaderboard.Entries) {
    return result;
  }
  const entries = Object.values(clazz.Leaderboard.Entries);
  for (const entry of entries) {
    const rounds = [];
    for (const round of Object.values(entry.Rounds || {})) {
      for (const [key, hole] of Object.entries(round.HoleScores || {})) {
        if (!/^H\d+$/.test(key) || !isPlayedHole(hole)) continue;
        const toPar = hole.Score.Value - hole.Par;
        if (hole.Score.Value === 1) result.holeInOnes += 1;
        if (toPar <= -2) result.eaglesOrBetter += 1;
        if (toPar === -1) result.birdies += 1;
      }
      if (hasStarted(round)) {
        result.rounds = Math.max(result.rounds, round.Number);
      }
      const summary = summarizeRound(round);
      if (summary) {
        rounds.push(summary);
      }
    }
    if (rounds.length > 0) {
      result.players.push({
        id: entry.MemberID.trim(),
        name: `${entry.FirstName.trim()} ${entry.LastName.trim()}`,
        rounds,
      });
    }
  }
  result.cutToPar = getCutToPar(clazz, entries);
  return result;
}

function average(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

// Rank players by their average strokes per round. To keep one-off rounds
// out of the list, players need at least half as many rounds as the busiest
// player.
function rankByAverage(roundsByPlayer, absoluteMinRounds) {
  const all = [...roundsByPlayer.values()];
  if (all.length === 0) {
    return { minRounds: absoluteMinRounds, players: [] };
  }
  const maxRounds = Math.max(...all.map(p => p.strokes.length));
  const minRounds = Math.max(absoluteMinRounds, Math.ceil(maxRounds / 2));
  const players = all
    .filter(p => p.strokes.length >= minRounds)
    .map(p => ({
      playerId: p.playerId,
      name: p.name,
      rounds: p.strokes.length,
      average: average(p.strokes),
    }))
    .sort((a, b) => a.average - b.average || b.rounds - a.rounds)
    .slice(0, TOP_COUNT);
  return { minRounds, players };
}

function addRound(roundsByPlayer, player, round) {
  let item = roundsByPlayer.get(player.id);
  if (!item) {
    item = { playerId: player.id, name: player.name, strokes: [] };
    roundsByPlayer.set(player.id, item);
  }
  item.strokes.push(round.strokes);
}

// Combine the stored per-competition summaries into the stats shown on the
// players page. `items` is a list of `{ competition, data }` where data comes
// from summarizeLeaderboard(). Returns null when there is nothing to show.
export function aggregateSeasonStats(items) {
  const allRounds = new Map();
  const finalRounds = new Map();
  const lowRounds = [];
  const cuts = [];
  let birdies = 0;
  let eaglesOrBetter = 0;
  let holeInOnes = 0;
  let competitions = 0;

  for (const { competition, data } of items) {
    if (!data || !data.players || data.players.length === 0) {
      continue;
    }
    competitions += 1;
    birdies += data.birdies;
    eaglesOrBetter += data.eaglesOrBetter;
    holeInOnes += data.holeInOnes;
    if (typeof data.cutToPar === 'number') {
      cuts.push(data.cutToPar);
    }
    for (const player of data.players) {
      for (const round of player.rounds) {
        addRound(allRounds, player, round);
        if (data.rounds > 1 && round.n === data.rounds) {
          addRound(finalRounds, player, round);
        }
        lowRounds.push({
          playerId: player.id,
          name: player.name,
          strokes: round.strokes,
          toPar: round.toPar,
          round: round.n,
          competition,
        });
      }
    }
  }

  if (competitions === 0) {
    return null;
  }

  lowRounds.sort(
    (a, b) =>
      a.strokes - b.strokes ||
      a.toPar - b.toPar ||
      new Date(a.competition.start) - new Date(b.competition.start),
  );

  return {
    competitions,
    scoringAverage: rankByAverage(allRounds, 3),
    finalRoundAverage: rankByAverage(finalRounds, 2),
    cut:
      cuts.length > 0
        ? { averageToPar: average(cuts), competitions: cuts.length }
        : null,
    lowestRound: lowRounds[0] || null,
    birdies,
    eaglesOrBetter,
    holeInOnes,
  };
}

// 0 → "E", 2 → "+2", -3 → "−3", 1.75 → "+1.8"
export function formatToPar(value, fractionDigits = 0) {
  const fixed = Math.abs(value).toFixed(fractionDigits);
  if (Number(fixed) === 0) {
    return 'E';
  }
  return `${value > 0 ? '+' : '−'}${fixed}`;
}
