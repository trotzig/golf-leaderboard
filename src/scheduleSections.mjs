import { format } from 'date-fns';

const DAY = 24 * 60 * 60 * 1000;

// Entries spanning more than a few days aren't tournaments but umbrella
// entries, like a play-off series or a sign-up period.
function isLongRunning(c) {
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

export function shortDateRange(start, end) {
  const sameMonth = format(start, 'yyyy-MM') === format(end, 'yyyy-MM');
  if (sameMonth && format(start, 'd') === format(end, 'd')) {
    return format(start, 'MMM d');
  }
  return `${format(start, 'MMM d')}–${format(end, sameMonth ? 'd' : 'MMM d')}`;
}

function isWinner(position) {
  return position === '1' || position === 'T1';
}

// Picks the winner(s) out of a competition's final scores.
export function getWinner(scores) {
  const winners = (scores || []).filter(s => isWinner(s.position));
  if (winners.length === 0) {
    return null;
  }
  return {
    names: winners.map(w => `${w.player.firstName} ${w.player.lastName}`),
    scoreText: winners[0].scoreText,
    score: winners[0].score,
  };
}
