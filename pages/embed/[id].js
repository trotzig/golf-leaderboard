import Head from 'next/head';
import React from 'react';

import competitionDateString from '../../src/competitionDateString.js';
import ensureDates from '../../src/ensureDates.js';
import prisma from '../../src/prisma';

export default function PlayerScoreEmbedPage({ player }) {
  const competition = player.leaderboardEntry.competition;
  ensureDates(competition);

  return (
    <div className="pemb-page">
      <Head>
        <title>
          {player.firstName} {player.lastName} - live score
        </title>
        <style>{`
          footer { display: none !important; }
          main { min-height: auto !important; }
          body { padding: 0 !important; overflow-y: auto !important; background: none !important; }
        `}</style>
      </Head>
      <a className="pemb-box" href="/leaderboard" target="_blank">
        <div className="pemb-intro">
          Live score via{' '}
          <span className="pemb-fake-link">
            {process.env.NEXT_PUBLIC_TITLE}
          </span>
        </div>
        <h1>{competition.name}</h1>
        <div className="pemb-date">{competitionDateString(competition)}</div>
        <div className="pemb-player">
          <div className="pemb-player-position">
            {player.leaderboardEntry.positionText}
          </div>
          <div>
            <div className="pemb-player-name">
              {player.firstName} {player.lastName}
            </div>
            <div className="pemb-player-club">{player.clubName}</div>
          </div>
          <div className="pemb-player-right">
            <div
              className={`pemb-player-score ${
                (player.leaderboardEntry.scoreText || '').startsWith('-')
                  ? 'under-par'
                  : ''
              }`}
            >
              {player.leaderboardEntry.scoreText}
            </div>
            <div className="pemb-player-score-today">
              {player.leaderboardEntry.hole}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const player = await prisma.player.findUnique({
    where: { slug: params.id },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      clubName: true,
      oomPosition: true,
      leaderBoardEntries: {
        orderBy: {
          competition: {
            start: 'desc',
          },
        },
        take: 1,
        select: {
          positionText: true,
          competitionId: true,
          scoreText: true,
          hole: true,
          competition: {
            select: {
              id: true,
              name: true,
              venue: true,
              start: true,
              end: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  if (!player) {
    return { notFound: true };
  }

  player.leaderboardEntry = player.leaderBoardEntries[0];
  delete player.leaderBoardEntries;

  if (!player.leaderboardEntry) {
    return { notFound: true };
  }
  player.leaderboardEntry.competition.end =
    player.leaderboardEntry.competition.end.getTime();
  player.leaderboardEntry.competition.start =
    player.leaderboardEntry.competition.start.getTime();
  return {
    props: { player },
  };
}
