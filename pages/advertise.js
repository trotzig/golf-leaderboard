import AdvertisePage from '../src/AdvertisePage.js';
import prisma from '../src/prisma.mjs';

export default AdvertisePage;

export async function getServerSideProps({ res }) {
  const year = new Date().getFullYear();
  const [subscriberCount, playerCount, competitionCount] = await Promise.all([
    prisma.account.count(),
    prisma.player.count(),
    prisma.competition.count({
      where: {
        visible: true,
        start: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
    }),
  ]);

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  );

  return {
    props: { subscriberCount, playerCount, competitionCount, year },
  };
}
