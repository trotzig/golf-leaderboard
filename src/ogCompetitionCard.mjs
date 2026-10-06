import { format } from 'date-fns';

import calendarDate from './calendarDate.mjs';
import formatCompetitionName from './formatCompetitionName.js';

function dateRange(startDate, endDate) {
  const start = calendarDate(startDate);
  const end = calendarDate(endDate);
  const year = format(end, 'yyyy');
  if (format(start, 'yyyyMMdd') === format(end, 'yyyyMMdd')) {
    return `${format(start, 'MMMM d')}, ${year}`;
  }
  if (format(start, 'yyyyMM') === format(end, 'yyyyMM')) {
    return `${format(start, 'MMMM d')}–${format(end, 'd')}, ${year}`;
  }
  return `${format(start, 'MMMM d')} – ${format(end, 'MMMM d')}, ${year}`;
}

// The text that goes on the share image for a tournament. `winnerScore` is the
// PlayerCompetitionScore of the player in first place, if there is one yet.
export default function ogCompetitionCard(competition, winnerScore) {
  const card = {
    title: formatCompetitionName(competition.name),
    details: [
      competition.venue,
      dateRange(competition.start, competition.end),
    ].filter(Boolean),
  };
  if (winnerScore) {
    const { player } = winnerScore;
    card.winner = {
      playerId: player.id,
      name: `${player.firstName} ${player.lastName}`,
      scoreText: winnerScore.scoreText,
    };
  }
  return card;
}
