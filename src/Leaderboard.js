import Link from 'next/link';
import React from 'react';

import competitionDateString from './competitionDateString.js';
import { detectFormat, isGoodScore, formatLabel } from './competitionFormat.mjs';
import formatCompetitionName from './formatCompetitionName';
import fixParValue from './fixParValue';
import FlagIcon, { getCountryName } from './FlagIcon';
import Icon from './Icon';
import normalizeName from './normalizeName.js';

export default function Leaderboard({ competition, now }) {
  const finished = competition.finished;
  const entries = competition.leaderboardEntries;
  const format = detectFormat({
    scoreTexts: entries.map(e => e.scoreText),
  });
  return (
    <Link href={`/t/${competition.slug}`} className="leaderboard">
        <div
          className={`leaderboard-legend${finished ? '' : ' leaderboard-legend--live'}`}
        >
          {finished ? 'Final results' : 'Live now'}
        </div>
        <h4 className="leaderboard-competition-name">
          <span>{formatCompetitionName(competition.name)}</span>
        </h4>
        <p className="leaderboard-description">
          {competition.venue} —{' '}
          {competitionDateString(competition, now, { finished })}
          {formatLabel(format) && ` — ${formatLabel(format)}`}
        </p>
        {entries.length === 0 ? (
          <div className="leaderboard-show-button">Show leaderboard</div>
        ) : (
          <>
            <LeaderboardTable entries={entries} finished={finished} />
            <div className="leaderboard-view-all">View full leaderboard <Icon name="arrow-right" /></div>
          </>
        )}
    </Link>
  );
}

// The top of a leaderboard. Takes entries shaped like LeaderboardEntry rows.
export function LeaderboardTable({ entries, finished, limit = 3 }) {
  const format = detectFormat({
    scoreTexts: entries.map(e => e.scoreText),
  });
  return (
    <div className="leaderboard-table-wrap">
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
          {entries.slice(0, limit).map((entry, i) => {
            const scoreClasses = ['leaderboard-score'];
            if (isGoodScore(format, entry.score)) {
              scoreClasses.push('under-par');
            }

            return (
              <tr key={i}>
                <td>{entry.positionText}</td>
                <td>
                  {normalizeName(entry.player.firstName)}{' '}
                  {normalizeName(entry.player.lastName)}
                  <div className="leaderboard-club">
                    <FlagIcon nationality={entry.player.nationality} />
                    {entry.player.clubName ||
                      getCountryName(entry.player.nationality)}
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
  );
}
