import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { getAllCompetitions } from '../src/staticData.js';
import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import fetchJsonP from '../src/fetchJsonP';

function getCurrentCompetitionId() {
  const now = new Date();

  const competitions = getAllCompetitions();

  competitions.sort((a, b) => {
    if (a.end < b.end) {
      return 1;
    }
    if (a.end > b.end) {
      return -1;
    }
    return 0;
  });
  for (const c of competitions) {
    if ((now.getTime() + 48 * 60 * 60 * 1000) > c.start.getTime()) {
      return c.id;
    }
  }
  return competitions[0].id;
}

export default function LeaderboardRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    async function run() {
      const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/`;
      const payload = await fetchJsonP(url);
      router.replace(`/competitions/${getCurrentCompetitionId(payload)}`);
    }
    run();
  }, []);
  return (
    <div className="leaderboard">
      <Menu />
      <LoadingSkeleton />
    </div>
  );
}
