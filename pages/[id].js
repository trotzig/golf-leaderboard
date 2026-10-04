import PlayerPage from '../src/PlayerPage.js';
import isQualifyingEvent from '../src/isQualifyingEvent.mjs';
import prisma from '../src/prisma';

export default PlayerPage;

export async function getServerSideProps({ params, query, req }) {
  if (params.id.length < 7) {
    return { notFound: true };
  }
  const player = await prisma.player.findUnique({
    where: { slug: params.id },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      clubName: true,
      nationality: true,
      oomPosition: true,
      competitionScore: {
        orderBy: {
          competition: {
            start: 'desc',
          },
        },
        select: {
          position: true,
          playerId: true,
          competitionId: true,
          position: true,
          scoreText: true,
          score: true,
          competition: {
            select: {
              id: true,
              name: true,
              venue: true,
              start: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  if (!player) {
    const redirect = await prisma.player.findFirst({
      where: { slug: { startsWith: `${params.id}-` } },
      orderBy: { slug: 'asc' },
      select: { slug: true },
    });
    if (redirect) {
      return { redirect: { destination: `/${redirect.slug}`, permanent: false } };
    }
    return { notFound: true };
  }
  player.competitionScore = player.competitionScore.filter(
    item => !isQualifyingEvent(item.competition),
  );
  for (const item of player.competitionScore) {
    item.competition.start = item.competition.start.toISOString();
  }
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${req.headers.host}`;
  return {
    props: { player, season: query.season || null, baseUrl },
  };
}
