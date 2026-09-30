import TeeTimesPage from '../../../../src/TeeTimesPage.js';
import prisma from '../../../../src/prisma';

export default TeeTimesPage;

export async function getServerSideProps({ req, params, query }) {
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
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${req.headers.host}`;
  const props = { competition, now: Date.now(), baseUrl };
  if (query.round) {
    props.round = query.round;
  }
  return { props };
}
