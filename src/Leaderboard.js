import Link from 'next/link';
import React from 'react';

import competitionDateString from './competitionDateString.js';
import fixParValue from './fixParValue';

const PLACEHOLDER_ENTRIES = [
  { position: 1, positionText: '1', score: -3, scoreText: '-3', hole: '18', player: { firstName: 'Anders', lastName: 'Lindqvist', clubName: 'Stockholms GK' } },
  { position: 2, positionText: '2', score: -1, scoreText: '-1', hole: '16', player: { firstName: 'Maria', lastName: 'Eriksson', clubName: 'Kungliga GK' } },
  { position: 3, positionText: '3', score: 0, scoreText: 'E', hole: '14', player: { firstName: 'Johan', lastName: 'Bergström', clubName: 'Vallda GK' } },
];

export default function Leaderboard({ competition, now }) {
  const finished = competition.finished;
  return (
    <Link href={`/t/${competition.slug}`} className="leaderboard">
        <div className="leaderboard-legend">
          {finished ? 'Final results' : 'Leaderboard'}
        </div>
        <h4 className="leaderboard-competition-name">
          <span>{competition.name}</span>
        </h4>
        <p className="leaderboard-description">
          {competition.venue} —{' '}
          {competitionDateString(competition, now, { finished })}
        </p>
        <div className={`leaderboard-table-wrap${competition.leaderboardEntries.length === 0 ? ' leaderboard-table-wrap--empty' : ''}`}>
          {competition.leaderboardEntries.length === 0 && (
            <div className="leaderboard-empty-overlay">No scores available yet</div>
          )}
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Player</th>
                <th>Total</th>
                {!finished && <th>Thru</th>}
              </tr>
            </thead>
            <tbody>
              {(competition.leaderboardEntries.length > 0
                ? competition.leaderboardEntries.slice(0, 3)
                : PLACEHOLDER_ENTRIES
              ).map(entry => {
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
                    {!finished && <td>{entry.hole}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="leaderboard-view-all">View full leaderboard</div>
    </Link>
  );
}
