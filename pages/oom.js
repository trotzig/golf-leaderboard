import OrderOfMeritPage from '../src/OrderOfMeritPage.js';
import getCollidingSlugs from '../src/getCollidingSlugs.mjs';
import prisma from '../src/prisma';

export default OrderOfMeritPage;

export async function getServerSideProps() {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const [collidingSlugs, upcomingCompetitions] = await Promise.all([
    getCollidingSlugs(),
    // Ongoing and future events, used to show what's left of the season.
    prisma.competition.findMany({
      where: {
        visible: true,
        finished: false,
        end: { gte: new Date(now - h24) },
      },
      orderBy: { start: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
      },
    }),
  ]);
  return {
    props: {
      collidingSlugs: [...collidingSlugs],
      upcomingCompetitions: upcomingCompetitions.map(c => ({
        ...c,
        start: c.start.getTime(),
        end: c.end.getTime(),
      })),
      now,
    },
  };
}
