import prisma from '../../../../../src/prisma';

export async function getServerSideProps({ params }) {
  const [competition, player] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: params.competitionSlug },
      select: { slug: true },
    }),
    prisma.player.findUnique({
      where: { id: params.playerId },
      select: { slug: true },
    }),
  ]);
  if (!competition || !player) {
    return { notFound: true };
  }
  return {
    redirect: {
      destination: `/t/${competition.slug}?player=${player.slug}`,
      permanent: true,
    },
  };
}

export default function CompetitionPlayer() {
  return null;
}
