import SchedulePage from '../src/SchedulePage.js';
import prisma from '../src/prisma';
import { getWinner, splitSchedule } from '../src/scheduleSections.mjs';

export default SchedulePage;

export async function getServerSideProps({ query }) {
  const now = Date.now();
  const currentYear = new Date(now).getFullYear();
  const selectedYear = query.year ? parseInt(query.year, 10) : currentYear;

  const allCompetitions = await prisma.competition.findMany({
    select: { start: true },
    orderBy: { start: 'asc' },
  });
  const yearsSet = new Set(
    allCompetitions.map(c => new Date(c.start).getFullYear()),
  );
  const years = [...yearsSet].sort((a, b) => a - b);

  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear + 1, 0, 1);

  const competitions = await prisma.competition.findMany({
    orderBy: { start: 'asc' },
    where: {
      visible: true,
      start: { gte: yearStart, lt: yearEnd },
    },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
      categories: true,
      finished: true,
      competitionScore: {
        where: { position: { in: ['1', 'T1'] } },
        select: {
          position: true,
          scoreText: true,
          score: true,
          player: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const { current } = splitSchedule(competitions, now);
  const leaderboardEntries = current.length
    ? await prisma.leaderboardEntry.findMany({
        where: { competitionId: { in: current.map(c => c.id) } },
        orderBy: { position: 'asc' },
        select: {
          competitionId: true,
          positionText: true,
          position: true,
          scoreText: true,
          score: true,
          hole: true,
          player: {
            select: {
              id: true,
              slug: true,
              firstName: true,
              lastName: true,
              clubName: true,
              nationality: true,
            },
          },
        },
      })
    : [];

  for (const c of competitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
    c.winner = getWinner(c.competitionScore);
    delete c.competitionScore;
    if (current.includes(c)) {
      c.leaderboardEntries = leaderboardEntries.filter(
        e => e.competitionId === c.id,
      );
    }
  }
  return { props: { competitions, years, selectedYear, now } };
}
