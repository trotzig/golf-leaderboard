import prisma from '../src/prisma';
import StartPage from '../src/StartPage.js';

export default StartPage;

export async function getServerSideProps() {
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'asc' },
    where: { visible: true },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
    },
  });
  for (const c of competitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
  }

  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;

  const pastCompetitions = competitions
    .filter(c => c.end + h24 < now)
    .reverse()
    .slice(0, 3);
  let currentCompetition = competitions.filter(
    c => c.start <= now && c.end + h24 >= now,
  )[0];

  let upcomingCompetitions = competitions.filter(c => now < c.start);
  const nextCompetition = currentCompetition
    ? undefined
    : upcomingCompetitions[0];

  if (nextCompetition) {
    upcomingCompetitions.shift();
  }

  upcomingCompetitions = upcomingCompetitions.slice(0, 3);

  if (currentCompetition) {
    // re-read current comp, now with all the related info
    currentCompetition = await prisma.competition.findUnique({
      where: { id: currentCompetition.id },
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
        finished: true,
        leaderboardEntries: {
          orderBy: {
            position: 'asc',
          },
          select: {
            positionText: true,
            position: true,
            scoreText: true,
            score: true,
            hole: true,
            player: {
              select: {
                id: true,
                slug: true,
                firstName: true,
                lastName: true,
                clubName: true,
              },
            },
          },
        },
      },
    });
    currentCompetition.start = currentCompetition.start.getTime();
    currentCompetition.end = currentCompetition.end.getTime();
  }

  const props = {
    pastCompetitions,
    upcomingCompetitions,
    now,
  };
  if (nextCompetition) {
    props.nextCompetition = nextCompetition;
  }
  if (currentCompetition) {
    props.currentCompetition = currentCompetition;
  }
  return { props };
}
