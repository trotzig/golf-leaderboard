import prisma from '../../src/prisma';
import EmbedPage from '../../src/EmbedPage';

export default EmbedPage;

export async function getServerSideProps({ params }) {
  const player = await prisma.player.findUnique({
    where: { slug: params.id },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      clubName: true,
      oomPosition: true,
      leaderBoardEntries: {
        orderBy: {
          competition: {
            start: 'desc',
          },
        },
        take: 1,
        select: {
          positionText: true,
          competitionId: true,
          scoreText: true,
          hole: true,
          competition: {
            select: {
              id: true,
              name: true,
              venue: true,
              start: true,
              end: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  if (!player) {
    return { notFound: true };
  }

  player.leaderboardEntry = player.leaderBoardEntries[0];
  delete player.leaderBoardEntries;

  if (!player.leaderboardEntry) {
    return { notFound: true };
  }
  player.leaderboardEntry.competition.end =
    player.leaderboardEntry.competition.end.getTime();
  player.leaderboardEntry.competition.start =
    player.leaderboardEntry.competition.start.getTime();

  const title = `${player.firstName} ${player.lastName} - live score`;
  const competition = player.leaderboardEntry.competition;
  return {
    props: { players: [player], competition, title },
  };
}
