import React from 'react';

import Menu from '../src/Menu';
import getCurrentCompetition from '../src/getCurrentCompetition.js';

export default function LeaderboardRedirectPage() {
  return (
    <div className="leaderboard-page">
      <Menu />
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
