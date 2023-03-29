import CompetitionPage from '../../../src/CompetitionPage.js';
import prisma from '../../../src/prisma';
import profileProps from '../../../src/profileProps.js';

export default CompetitionPage;

export async function getServerSideProps({ req, params }) {
  const [competition, proProps] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: params.competitionSlug },
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
      },
    }),
    profileProps({ req }),
  ]);
  if (!competition) {
    return { notFound: true };
  }
  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  const {
    props: { account },
  } = proProps;
  return {
    props: { competition, account: account || null },
  };
}
