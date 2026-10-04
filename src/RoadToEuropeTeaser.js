import Link from 'next/link';
import React from 'react';

import formatCompetitionName from './formatCompetitionName';
import { CHALLENGE_TOUR_SPOTS, parsePosition } from './roadToEurope.mjs';

function formatEventsLeft(count) {
  if (count === 0) {
    return 'Final standings';
  }
  if (count === 1) {
    return 'One event left';
  }
  return `${count} events left`;
}

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
        <p className="rte-teaser-meta">
          {formatEventsLeft(remainingEvents.length)}
          {remainingEvents.length > 0
            ? ` · ${remainingEvents.map(c => formatCompetitionName(c.name)).join(', ')}`
            : null}
        </p>
        <p className="rte-teaser-lead">
          {seasonOver
            ? `These ${CHALLENGE_TOUR_SPOTS} earned a Challenge Tour card.`
            : `The top ${CHALLENGE_TOUR_SPOTS} get a Challenge Tour card. Here's who's in line right now.`}
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
