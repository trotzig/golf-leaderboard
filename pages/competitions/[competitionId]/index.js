import prisma from '../../../src/prisma';

export default function CompetitionRedirectPage() {
  return (
    <div className="leaderboard-page">
      <Menu />
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(params.competitionId, 10) },
    select: {
      slug: true,
    },
  });

  return {
    redirect: {
      destination: `/t/${competition.slug}`,
      permanent: false,
    },
  };
}
