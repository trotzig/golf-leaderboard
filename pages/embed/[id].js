import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { useJsonPData } from '../../src/fetchJsonP.js';
import competitionDateString from '../../src/competitionDateString.js';
import ensureDates from '../../src/ensureDates.js';
import getCurrentCompetition from '../../src/getCurrentCompetition.js';
import ordinal from '../../src/ordinal.js';
import prisma from '../../src/prisma';

export default function PlayerScoreEmbedPage({ player, competition }) {
  const router = useRouter();
  const { id } = router.query;

  ensureDates(competition);
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
  );

  let playerScore = JSON.parse(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(`pemb-score-${competition.id}`)
      : '{}',
  );
  if (data) {
    const entry = Object.values(
      Object.values(data.Classes)[0].Leaderboard.Entries,
    ).find(entry => entry.MemberID === player.id);
    playerScore = {
      position: entry.Position.Calculated,
      score: entry.ResultSum.ToParText,
    };
    window.localStorage.setItem(
      `pemb-score-${competition.id}`,
      JSON.stringify(playerScore),
    );
  }

  return (
    <div className="pemb-page">
      <Head>
        <title>
          {player.firstName} {player.lastName} - live score
        </title>
        <style>{`
          footer { display: none !important; }
          main { min-height: auto !important; }
          body { overflow-y: auto !important; background: none !important; }
        `}</style>
      </Head>
      <a className="pemb-box" href="/leaderboard" target="_blank">
        <div className="pemb-intro">
          Live score via{' '}
          <a href="/blank" target="_blank">
            {process.env.NEXT_PUBLIC_TITLE}
          </a>
        </div>
        <h1>{competition.name}</h1>
        <div className="pemb-date">{competitionDateString(competition)}</div>
        <div className="pemb-player">
          <div className="pemb-player-position">{playerScore.position}</div>
          <div>
            <div className="pemb-player-name">
              {player.firstName} {player.lastName}
            </div>
            <div className="pemb-player-club">{player.clubName}</div>
          </div>
          <div
            className={`pemb-player-score ${
              (playerScore.score || '').startsWith('-') ? 'under-par' : ''
            }`}
          >
            {playerScore.score}
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
    },
  });
  if (!player) {
    return { notFound: true };
  }
  const competition = await getCurrentCompetition();

  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  return {
    props: { player, competition },
  };
}
