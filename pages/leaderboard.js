import React from 'react';

import Menu from '../src/Menu';
import prisma from '../src/prisma';

async function getCurrentCompetitionSlug() {
  const now = new Date();
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'desc' },
  });
  const candidates = competitions.filter(
    c =>
      now.getTime() + 48 * 60 * 60 * 1000 > c.start.getTime() &&
      now.getTime() - 48 * 60 * 60 * 1000 < c.end.getTime(),
  );
  if (candidates.length) {
    return candidates[candidates.length - 1].slug;
  }

  const previous = competitions.find(c => now.getTime() > c.end.getTime());
  if (previous) {
    return previous.slug;
  }
  return competitions[0].slug;
}

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
      destination: `/t/${await getCurrentCompetitionSlug()}`,
      permanent: false,
    },
  };
}
