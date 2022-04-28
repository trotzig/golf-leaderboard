import React from 'react';

import Menu from '../src/Menu';
import prisma from '../src/prisma';


async function getCurrentCompetitionId() {
  const now = new Date();
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'desc' },
  });
  for (const c of competitions) {
    if (now.getTime() + 48 * 60 * 60 * 1000 > c.start.getTime()) {
      return c.id;
    }
  }
  return competitions[0].id;
}

export default function LeaderboardRedirectPage() {
  return (
    <div className="leaderboard">
      <Menu />
    </div>
  );
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: `/competitions/${await getCurrentCompetitionId()}`,
      permanent: false,
    },
  };
}
