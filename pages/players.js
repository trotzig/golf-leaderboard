import PlayersPage from '../src/PlayersPage.js';
import prisma from '../src/prisma';
import profileProps from '../src/profileProps.js';

export default PlayersPage;

export async function getServerSideProps({ req, query }) {
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
  ] = await Promise.all([
    profileProps({ req }),
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
  ]);
  return { props: { account: account || null, players } };
}
