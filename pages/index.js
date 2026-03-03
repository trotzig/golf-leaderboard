import fs from 'fs';
import path from 'path';

import prisma from '../src/prisma';
import StartPage from '../src/StartPage.js';

export default StartPage;

export async function getServerSideProps() {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;

  const [pastCompetitions, upcomingCompetitions, currentCompetition] = await Promise.all([
    prisma.competition.findMany({
      where: { visible: true, end: { lt: new Date(now - h24) } },
      orderBy: { end: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
      },
    }),
    prisma.competition.findMany({
      where: { visible: true, start: { gt: new Date(now) } },
      orderBy: { start: 'asc' },
      take: 4,
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
      },
    }),
    prisma.competition.findFirst({
      where: {
        visible: true,
        start: { lte: new Date(now) },
        end: { gte: new Date(now - h24) },
      },
      orderBy: { start: 'asc' },
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
        finished: true,
        leaderboardEntries: {
          orderBy: { position: 'asc' },
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
    }),
  ]);

  for (const c of pastCompetitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
  }
  for (const c of upcomingCompetitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
  }
  if (currentCompetition) {
    currentCompetition.start = currentCompetition.start.getTime();
    currentCompetition.end = currentCompetition.end.getTime();
  }

  const nextCompetition = currentCompetition ? undefined : upcomingCompetitions[0];
  const upcomingSlice = nextCompetition
    ? upcomingCompetitions.slice(1, 4)
    : upcomingCompetitions.slice(0, 3);

  // Load reports from the src/reports/ directory
  const reportsDir = path.join(process.cwd(), 'src', 'reports');
  let reports = [];
  if (fs.existsSync(reportsDir)) {
    reports = fs
      .readdirSync(reportsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
      .slice(0, 3)
      .map(a => ({
        slug: a.slug,
        competitionName: a.competitionName,
        endDate: a.endDate,
        headline: a.headline,
        blurb: a.blurb,
        winnerName: a.winnerName || null,
        winnerPlayerId: a.winnerPlayerId || null,
        winnerImage: a.winnerImage || null,
      }));
  }

  const props = {
    pastCompetitions,
    upcomingCompetitions: upcomingSlice,
    reports,
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
