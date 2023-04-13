import prisma from './prisma';

export default async function getCurrentCompetition() {
  const now = new Date();
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'desc' },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
    },
  });
  const candidates = competitions.filter(
    c =>
      now.getTime() + 48 * 60 * 60 * 1000 > c.start.getTime() &&
      now.getTime() - 48 * 60 * 60 * 1000 < c.end.getTime(),
  );
  if (candidates.length) {
    return candidates[candidates.length - 1];
  }

  const previous = competitions.find(c => now.getTime() > c.end.getTime());
  if (previous) {
    return previous;
  }
  return competitions[0];
}
