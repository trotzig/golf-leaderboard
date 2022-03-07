import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import fetchJsonP from '../src/fetchJsonP';
import getCompetitions from '../src/getCompetitions';

function getCurrentCompetitionId(payload) {
    if (payload.DefaultCompetition) {
      return payload.DefaultCompetition.CompetitionID;
    }
  const now = new Date();

  const competitions = getCompetitions(payload, now);
  competitions.sort((a, b) => {
    if (a._end < b._end) {
      return 1;
    }
    if (a._end > b._end) {
      return -1;
    }
    return 0;
  });
  for (const c of competitions) {
    if (now > c._end) {
      return c.ID;
    }
  }
}

export default function LeaderboardRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    async function run() {
      const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/`;
      const payload = await fetchJsonP(url);
      router.replace(
        `/competitions/${getCurrentCompetitionId(payload)}`,
      );
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
