import prisma from '../../../src/prisma';
import EmbedPage from '../../../src/EmbedPage';
import getCurrentCompetition from '../../../src/getCurrentCompetition';

export default EmbedPage;

export async function getServerSideProps({ params }) {
  const currentCompetition = await getCurrentCompetition();
  const competition = await prisma.competition.findUnique({
    where: { id: currentCompetition.id },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
      leaderboardEntries: {
        where: {
          player: {
            clubName: params.id,
          },
        },
        orderBy: {
          position: 'asc',
        },
        select: {
          positionText: true,
          competitionId: true,
          scoreText: true,
          hole: true,
          player: {
            select: {
              id: true,
              slug: true,
              firstName: true,
              lastName: true,
              clubName: true,
              oomPosition: true,
            },
          },
        },
      },
    },
  });
  if (!competition || !competition.leaderboardEntries.length) {
    return { notFound: true };
  }

  for (const leaderboardEntry of competition.leaderboardEntries) {
    leaderboardEntry.player.leaderboardEntry = {
      ...leaderboardEntry,
      player: null,
    };
  }

  const players = competition.leaderboardEntries.map(le => le.player);

  if (!players || !players.length) {
    return { notFound: true };
  }

  competition.end = competition.end.getTime();
  competition.start = competition.start.getTime();
  const title = `${params.id} - live score`;
  return {
    props: { players, competition, title },
  };
}
