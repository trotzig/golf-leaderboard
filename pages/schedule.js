import SchedulePage from '../src/SchedulePage.js';
import prisma from '../src/prisma';
import { getPodium, splitSchedule } from '../src/scheduleSections.mjs';

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
        where: { position: { in: ['1', 'T1', '2', 'T2', '3', 'T3'] } },
        select: {
          position: true,
          scoreText: true,
          score: true,
          player: {
            select: {
              firstName: true,
              lastName: true,
              clubName: true,
              nationality: true,
            },
          },
        },
      },
    },
  });

  const { current, next, upcoming } = splitSchedule(competitions, now);

  // For events still to come, look up who won the last time the tour visited
  // the venue.
  const venues = [next, ...upcoming].map(c => c && c.venue).filter(Boolean);
  const previousVisits = venues.length
    ? await prisma.competition.findMany({
        where: {
          visible: true,
          venue: { in: venues },
          end: { lt: new Date(now) },
          competitionScore: { some: { position: { in: ['1', 'T1'] } } },
        },
        orderBy: { start: 'desc' },
        select: {
          name: true,
          slug: true,
          venue: true,
          start: true,
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
      })
    : [];
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
    c.podium = getPodium(c.competitionScore);
    delete c.competitionScore;
    const lastVisit =
      c.start > now && previousVisits.find(v => v.venue === c.venue);
    if (lastVisit) {
      c.lastVisit = {
        name: lastVisit.name,
        slug: lastVisit.slug,
        year: lastVisit.start.getFullYear(),
        podium: getPodium(lastVisit.competitionScore),
      };
    }
    if (current.includes(c)) {
      c.leaderboardEntries = leaderboardEntries.filter(
        e => e.competitionId === c.id,
      );
    }
  }
  return { props: { competitions, years, selectedYear, now } };
}
