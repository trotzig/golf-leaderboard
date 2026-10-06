import { format } from 'date-fns';

import calendarDate from './calendarDate.mjs';

const DAY = 24 * 60 * 60 * 1000;

// Entries spanning more than a few days aren't tournaments but umbrella
// entries, like a play-off series or a sign-up period.
export function isLongRunning(c) {
  return +c.end - +c.start > 4 * DAY;
}

// Splits a season into the parts of the schedule page. An event stays current
// for a day after its end date, which is midnight on the final day of play.
// `upcoming` and `past` are sorted with the latest event first.
export function splitSchedule(competitions, now) {
  const nowMs = +now;
  const byStart = [...competitions].sort((a, b) => +a.start - +b.start);
  const current = [];
  const future = [];
  const past = [];
  for (const c of byStart) {
    if (+c.end + DAY <= nowMs) {
      past.push(c);
    } else if (+c.start > nowMs || isLongRunning(c)) {
      future.push(c);
    } else {
      current.push(c);
    }
  }
  // Without an ongoing event, the next one up takes the spotlight.
  let next = null;
  if (current.length === 0) {
    const nextIndex = future.findIndex(c => !isLongRunning(c));
    if (nextIndex !== -1) {
      [next] = future.splice(nextIndex, 1);
    }
  }
  return {
    upcoming: future.reverse(),
    current,
    next,
    past: past.reverse(),
  };
}

export function shortDateRange(startDate, endDate) {
  const start = calendarDate(startDate);
  const end = calendarDate(endDate);
  const sameMonth = format(start, 'yyyy-MM') === format(end, 'yyyy-MM');
  if (sameMonth && format(start, 'd') === format(end, 'd')) {
    return format(start, 'MMM d');
  }
  return `${format(start, 'MMM d')}–${format(end, sameMonth ? 'd' : 'MMM d')}`;
}

function rank(position) {
  return parseInt(String(position).replace(/^T/, ''), 10);
}

// Picks the top three (and anyone tied with them) out of a competition's
// final scores, shaped like leaderboard entries.
export function getPodium(scores) {
  return (scores || [])
    .filter(s => rank(s.position) <= 3)
    .sort((a, b) => rank(a.position) - rank(b.position))
    .map(s => ({
      position: rank(s.position),
      positionText: s.position,
      scoreText: s.scoreText,
      score: s.score,
      player: s.player,
    }));
}

export function getWinner(podium) {
  const winners = (podium || []).filter(e => e.position === 1);
  if (winners.length === 0) {
    return null;
  }
  return {
    names: winners.map(w => `${w.player.firstName} ${w.player.lastName}`),
    scoreText: winners[0].scoreText,
    score: winners[0].score,
  };
}

// Number of rounds, or null for umbrella entries that aren't tournaments.
export function roundCount(competition) {
  if (isLongRunning(competition)) {
    return null;
  }
  return Math.round((+competition.end - +competition.start) / DAY) + 1;
}

export function startsIn(start, now) {
  const days = Math.ceil((+start - +now) / DAY);
  if (days <= 0) {
    return 'Started';
  }
  if (days === 1) {
    return 'Tomorrow';
  }
  if (days < 14) {
    return `In ${days} days`;
  }
  if (days < 60) {
    return `In ${Math.round(days / 7)} weeks`;
  }
  return `In ${Math.round(days / 30)} months`;
}

const SHORT_TOUR_NAMES = {
  'Cutter & Buck Tour': 'C&B',
  'ECCO Tour': 'ECCO',
};

export function shortTourName(tour) {
  return SHORT_TOUR_NAMES[tour] || tour;
}
