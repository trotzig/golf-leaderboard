import Link from 'next/link';
import React from 'react';

import formatCompetitionName from './formatCompetitionName';
import {
  CHALLENGE_TOUR_SPOTS,
  getTeaserIntro,
  parsePosition,
} from './roadToEurope.mjs';

export default function RoadToEuropeTeaser({ players, remainingEvents }) {
  if (!players || players.length === 0) {
    return null;
  }
  const qualified = players.filter(
    p => parsePosition(p.oomPosition) <= CHALLENGE_TOUR_SPOTS,
  );
  const chasers = players.filter(
    p => parsePosition(p.oomPosition) > CHALLENGE_TOUR_SPOTS,
  );
  const seasonOver = remainingEvents.length === 0;
  return (
    <section className="rte-teaser" aria-labelledby="rte-teaser-title">
      <h3 id="rte-teaser-title">Road to Europe</h3>
      <div className="rte-teaser-card">
        <p className="rte-teaser-lead">
          {getTeaserIntro(
            remainingEvents.map(c => formatCompetitionName(c.name)),
          )}
        </p>
        <ol className="rte-teaser-list">
          {qualified.map(p => (
            <RacePlayer key={p.id} player={p} />
          ))}
        </ol>
        {chasers.length > 0 && !seasonOver ? (
          <>
            <p className="rte-teaser-line">Chasing</p>
            <ol className="rte-teaser-list rte-teaser-list--chasers">
              {chasers.map(p => (
                <RacePlayer key={p.id} player={p} />
              ))}
            </ol>
          </>
        ) : null}
        <Link href="/oom" className="rte-teaser-link">
          See the full ranking
        </Link>
      </div>
    </section>
  );
}

function RacePlayer({ player }) {
  return (
    <li>
      <span className="rte-teaser-position">{player.oomPosition}</span>
      <Link href={`/${player.slug}`}>
        {player.firstName} {player.lastName}
      </Link>
      {player.clubName ? (
        <span className="rte-teaser-club">{player.clubName}</span>
      ) : null}
    </li>
  );
}
