import CompetitionPage from '../../../src/CompetitionPage.js';
import prisma from '../../../src/prisma';

export default CompetitionPage;

export async function getServerSideProps({ params }) {
  const competition = await prisma.competition.findUnique({
    where: { slug: params.competitionSlug },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
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
