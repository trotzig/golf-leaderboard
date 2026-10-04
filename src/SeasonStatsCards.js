import Link from 'next/link';
import React from 'react';

import formatCompetitionName from './formatCompetitionName';
import { formatToPar } from './seasonStats.mjs';

const NUM_FORMATTER = Intl.NumberFormat('en-US');

function PlayerName({ player }) {
  if (!player.slug) {
    return <b>{player.name}</b>;
  }
  return <Link href={`/${player.slug}`}>{player.name}</Link>;
}

function AverageList({ title, ranking }) {
  if (ranking.players.length === 0) {
    return null;
  }
  return (
    <div className="season-stats-card">
      <h3>{title}</h3>
      <ol>
        {ranking.players.map(player => (
          <li key={player.playerId}>
            <span className="season-stats-value">
              {player.average.toFixed(1)}
            </span>
            <span>
              <PlayerName player={player} />
              <span className="season-stats-detail">
                {player.rounds} rounds
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="season-stats-note">Min. {ranking.minRounds} rounds</p>
    </div>
  );
}

function Tile({ label, value, detail }) {
  return (
    <div className="season-stats-tile">
      <span className="season-stats-tile-value">{value}</span>
      <span className="season-stats-tile-label">{label}</span>
      {detail ? <span className="season-stats-detail">{detail}</span> : null}
    </div>
  );
}

export default function SeasonStatsCards({ stats }) {
  if (!stats) {
    return null;
  }
  const round = stats.lowestRound;
  return (
    <section className="season-stats" aria-label="Season stats">
      <div className="season-stats-tiles">
        <Tile label="Birdies" value={NUM_FORMATTER.format(stats.birdies)} />
        <Tile
          label="Eagles or better"
          value={NUM_FORMATTER.format(stats.eaglesOrBetter)}
        />
        <Tile
          label="Hole-in-ones"
          value={NUM_FORMATTER.format(stats.holeInOnes)}
        />
        {stats.cut ? (
          <Tile
            label="Average cut line"
            value={formatToPar(stats.cut.averageToPar, 1)}
          />
        ) : null}
      </div>
      <div className="season-stats-cards">
        <AverageList
          title="Best scoring average"
          ranking={stats.scoringAverage}
        />
        <AverageList
          title="Best final-round average"
          ranking={stats.finalRoundAverage}
        />
        {round ? (
          <div className="season-stats-card">
            <h3>Lowest round</h3>
            <ol>
              <li>
                <span className="season-stats-value">
                  {round.strokes}
                  <span className="season-stats-detail">
                    {formatToPar(round.toPar)}
                  </span>
                </span>
                <span>
                  <PlayerName player={round} />
                  <span className="season-stats-detail">
                    <Link href={`/t/${round.competition.slug}`}>
                      {formatCompetitionName(round.competition.name)}
                    </Link>
                    {round.competition.venue
                      ? `, ${round.competition.venue}`
                      : null}
                  </span>
                </span>
              </li>
            </ol>
          </div>
        ) : null}
      </div>
      <p className="season-stats-note">
        This season, after {stats.competitions} finished{' '}
        {stats.competitions === 1 ? 'tournament' : 'tournaments'}.
      </p>
    </section>
  );
}
