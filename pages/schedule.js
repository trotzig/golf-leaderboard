import SchedulePage from '../src/SchedulePage.js';
import prisma from '../src/prisma';

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
    },
  });
  for (const c of competitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
  }
  return { props: { competitions, years, selectedYear, now } };
}
