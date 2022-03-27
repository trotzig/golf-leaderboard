import React from 'react';
import Link from 'next/link';

export default function Menu({ defaultCompetitionId }) {
  return (
    <nav>
      <Link href="/">
        <a>Home</a>
      </Link>
      <Link
        href={
          defaultCompetitionId
            ? `/competitions/${defaultCompetitionId}`
            : '/leaderboard'
        }
      >
        <a>Leaderboard</a>
      </Link>
      <Link href="/players">
        <a>Players</a>
      </Link>
      <Link href="/oom">
        <a>Order of merit</a>
      </Link>
    </nav>
  );
}
