import React from 'react';

import getCurrentCompetition from '../src/getCurrentCompetition.mjs';

export default function LeaderboardRedirectPage() {
  return (
    <div className="leaderboard-page">
    </div>
  );
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: `/t/${(await getCurrentCompetition()).slug}`,
      permanent: false,
    },
  };
}
