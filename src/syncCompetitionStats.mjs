import isQualifyingEvent from './isQualifyingEvent.mjs';
import parseJson from '../scripts/utils/parseJson.mjs';
import prisma from './prisma.mjs';
import { summarizeLeaderboard } from './seasonStats.mjs';

const HOUR = 60 * 60 * 1000;
const BATCH_SIZE = 5;

async function fetchStats(competition) {
  const res = await fetch(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch leaderboard for comp ${competition.name}. Status ${res.status}`,
    );
  }
  return summarizeLeaderboard(parseJson(await res.text()));
}

// Store round and hole stats for this season's finished competitions. Results
// can still be corrected shortly after a competition ends, so recently
// finished ones are refreshed. The rest are only fetched once.
export default async function syncCompetitionStats({ now = new Date() } = {}) {
  const year = now.getFullYear();
  const competitions = await prisma.competition.findMany({
    where: {
      visible: true,
      start: { gte: new Date(Date.UTC(year, 0, 1)) },
      end: { lt: new Date(now.getTime() - 24 * HOUR) },
    },
    select: {
      id: true,
      name: true,
      end: true,
      stats: { select: { competitionId: true } },
    },
  });
  const pending = competitions.filter(
    c =>
      !isQualifyingEvent(c) &&
      (!c.stats || c.end.getTime() > now.getTime() - 72 * HOUR),
  );

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    await Promise.all(
      pending.slice(i, i + BATCH_SIZE).map(async competition => {
        try {
          const data = await fetchStats(competition);
          await prisma.competitionStats.upsert({
            where: { competitionId: competition.id },
            create: { competitionId: competition.id, data },
            update: { data, updatedAt: now },
          });
          console.log(`Stored stats for competition ${competition.name}`);
        } catch (e) {
          console.warn(
            `Failed to store stats for competition ${competition.name}`,
            e,
          );
        }
      }),
    );
  }
}
