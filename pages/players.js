import PlayersPage from '../src/PlayersPage.js';
import getSeasonStats from '../src/getSeasonStats.mjs';
import prisma from '../src/prisma';
import profileProps from '../src/profileProps.js';

export default PlayersPage;

export async function getServerSideProps({ req, res, query }) {
  const years = query.years || '3';
  const since =
    years === 'all'
      ? null
      : new Date(new Date().getFullYear() - (parseInt(years, 10) - 1), 0, 1);

  const [
    {
      props: { account },
    },
    players,
    seasonStats,
  ] = await Promise.all([
    profileProps({ req, res }),
    prisma.player.findMany({
      where: since
        ? {
            OR: [
              {
                leaderBoardEntries: {
                  some: { competition: { start: { gte: since } } },
                },
              },
              {
                competitionScore: {
                  some: { competition: { start: { gte: since } } },
                },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        clubName: true,
        nationality: true,
        oomPosition: true,
      },
    }),
    getSeasonStats().catch(e => {
      console.warn('Failed to get season stats', e);
      return null;
    }),
  ]);
  return { props: { account: account || null, players, seasonStats } };
}
