import Head from 'next/head';
import React from 'react';

import ensureDates from './ensureDates.js';
import competitionDateString from './competitionDateString.js';

export default function EmbedPage({ title, players, competition }) {
  ensureDates(competition);

  return (
    <div className="pemb-page">
      <Head>
        <title>{title}</title>
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
        {players.map(player => {
          return (
            <div key={player.id} className="pemb-player">
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
          );
        })}
      </a>
    </div>
  );
}
