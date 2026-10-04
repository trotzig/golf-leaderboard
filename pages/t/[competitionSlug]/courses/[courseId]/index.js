import CoursePage from '../../../../../src/CoursePage.js';
import prisma from '../../../../../src/prisma';

export default CoursePage;

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
  const props = { competition, courseId: params.courseId };
  return { props };
}
