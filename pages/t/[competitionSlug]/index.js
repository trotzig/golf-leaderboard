import CompetitionPage from '../../../src/CompetitionPage.js';
import getCollidingSlugs from '../../../src/getCollidingSlugs.mjs';
import prisma from '../../../src/prisma';
import profileProps from '../../../src/profileProps.js';

export default CompetitionPage;

export async function getServerSideProps({ req, params }) {
  const [competition, proProps, collidingSlugs] = await Promise.all([
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
    getCollidingSlugs(),
  ]);
  if (!competition) {
    return { notFound: true };
  }
  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  const {
    props: { account },
  } = proProps;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${req.headers.host}`;
  return {
    props: {
      competition,
      account: account || null,
      now: Date.now(),
      baseUrl,
      collidingSlugs: [...collidingSlugs],  // array of [id, slug] pairs
    },
  };
}
