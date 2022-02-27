import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import Menu from '../src/Menu';
import fetchJsonP from '../src/fetchJsonP';

export default function LeaderboardRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    async function run() {
      const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/`;
      const payload = await fetchJsonP(url);
      router.replace(
        `/competitions/${payload.DefaultCompetition.CompetitionID}`,
      );
    }
    run();
  }, []);
  return (
    <div>
      <Menu />
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
