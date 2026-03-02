import CompetitionPage from '../../../src/CompetitionPage.js';
import fetchGolfboxUrl from '../../../src/fetchGolfboxUrl.js';
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

  let golfboxProps = {};
  try {
    const [initialData, initialTimesData, initialPlayersData, initialCompetitionData] =
      await Promise.all([
        fetchGolfboxUrl(`LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057`),
        fetchGolfboxUrl(`TeeTimesHandler/GetTeeTimes/CompetitionId/${competition.id}/language/2057`),
        fetchGolfboxUrl(`PlayersHandler/GetPlayers/CompetitionId/${competition.id}/language/2057`),
        fetchGolfboxUrl(`CompetitionHandler/GetCompetition/CompetitionId/${competition.id}/language/2057`),
      ]);
    golfboxProps = { initialData, initialTimesData, initialPlayersData, initialCompetitionData };
  } catch (e) {
    console.error('Failed to prefetch GolfBox data for competition page:', e);
  }

  return {
    props: { competition, account: account || null, now: Date.now(), ...golfboxProps },
  };
}
