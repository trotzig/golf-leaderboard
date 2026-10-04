import isQualifyingEvent from './isQualifyingEvent.mjs';
import prisma from './prisma.mjs';
import { aggregateSeasonStats } from './seasonStats.mjs';

// Season stats for the players page, or null if there is nothing to show.
export default async function getSeasonStats({ now = new Date() } = {}) {
  const items = await prisma.competitionStats.findMany({
    where: {
      competition: {
        visible: true,
        start: { gte: new Date(Date.UTC(now.getFullYear(), 0, 1)) },
      },
    },
    select: {
      data: true,
      competition: {
        select: { name: true, slug: true, venue: true, start: true },
      },
    },
  });
  const stats = aggregateSeasonStats(
    items.filter(item => !isQualifyingEvent(item.competition)),
  );
  if (!stats) {
    return null;
  }

  const listed = [
    ...stats.scoringAverage.players,
    ...stats.finalRoundAverage.players,
    ...(stats.lowestRound ? [stats.lowestRound] : []),
  ];
  const players = await prisma.player.findMany({
    where: { id: { in: listed.map(p => p.playerId) } },
    select: { id: true, slug: true },
  });
  const slugs = new Map(players.map(p => [p.id, p.slug]));
  for (const item of listed) {
    item.slug = slugs.get(item.playerId) || null;
  }
  if (stats.lowestRound) {
    const { name, slug, venue } = stats.lowestRound.competition;
    stats.lowestRound.competition = { name, slug, venue };
  }
  return stats;
}
