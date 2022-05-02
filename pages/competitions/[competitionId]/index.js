import CompetitionPage from '../../../src/CompetitionPage.js';
import prisma from '../../../src/prisma';

export default CompetitionPage;

export async function getServerSideProps({ params }) {
  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(params.competitionId, 10) },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
    },
  });
  if (!competition) {
    return { notFound: true };
  }
  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  return {
    props: { competition },
  };
}
