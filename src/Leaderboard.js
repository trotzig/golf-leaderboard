import Link from 'next/link';
import React from 'react';

import competitionDateString from './competitionDateString.js';
import fixParValue from './fixParValue.js';

export default function Leaderboard({ competition, now }) {
  return (
    <Link href={`/competitions/${competition.id}`}>
      <a className="leaderboard">
        <div className="leaderboard-legend">Leaderboard</div>
        <h4 className="leaderboard-competition-name">
          <span>{competition.name}</span>
        </h4>
        <p className="leaderboard-description">
          {competition.venue} — {competitionDateString(competition, now)}
        </p>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Player</th>
              <th>Total</th>
              <th>Thru</th>
            </tr>
          </thead>
          <tbody>
            {competition.leaderboardEntries.slice(0, 3).map(entry => {
              const scoreClasses = ['leaderboard-score'];
              if (entry.score < 0) {
                scoreClasses.push('under-par');
              }

              return (
                <tr key={entry.position}>
                  <td>{entry.positionText}</td>
                  <td>
                    {entry.player.firstName} {entry.player.lastName}
                    <div className="leaderboard-club">
                      {entry.player.clubName}
                    </div>
                  </td>
                  <td className={scoreClasses.join(' ')}>
                    {fixParValue(entry.scoreText)}
                  </td>
                  <td>{entry.hole}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="leaderboard-view-all">View full leaderboard</div>
      </a>
    </Link>
  );
}
