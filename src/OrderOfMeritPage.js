import Head from 'next/head';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { useJsonPData } from './fetchJsonP';
import FavoriteButton from './FavoriteButton';
import LoadingSkeleton from './LoadingSkeleton';
import ensureDates from './ensureDates.js';
import generateSlug from './generateSlug';
import normalizeName from './normalizeName.js';
import competitionDateString from './competitionDateString';
import formatCompetitionName from './formatCompetitionName';
import {
  CHALLENGE_TOUR_SPOTS,
  getRaceStatus,
  getRemainingEvents,
  isRoadToEurope,
} from './roadToEurope.mjs';

const NUM_FORMATTER = Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const POINTS_FORMATTER = Intl.NumberFormat('en-US');

function isTop10(res) {
  return /^T?[1-9]$/.test(res) || /^T?10$/.test(res);
}
function isFirst(res) {
  return /^T?1$/.test(res);
}

function getEntries(data) {
  const entryKeys = Object.keys(data.Entries);
  const result = entryKeys.map(key => data.Entries[key]);
  for (const entry of result) {
    entry.isFavorite = localStorage.getItem(entry.MemberID);
  }
  return result;
}

function RaceNote({ status }) {
  if (!status) {
    return null;
  }
  if (status.qualified) {
    return (
      <span className="oom-race-note oom-race-note--in">
        Challenge Tour spot · {POINTS_FORMATTER.format(status.margin)} pts
        clear
      </span>
    );
  }
  if (status.chaser) {
    return (
      <span className="oom-race-note">
        {POINTS_FORMATTER.format(status.behind)} pts from a Challenge Tour spot
      </span>
    );
  }
  return null;
}

function Player({
  entry,
  onFavorite,
  lastFavoriteChanged,
  collidingSlugs,
  raceStatus,
}) {
  const classes = ['player'];
  if (raceStatus?.qualified) {
    classes.push('oom-qualified');
  }
  const firstName = normalizeName(entry.FirstName);
  const lastName = normalizeName(entry.LastName);
  const slug = generateSlug(
    { ...entry, FirstName: firstName, LastName: lastName },
    collidingSlugs,
  );
  return (
    <li>
      <Link href={`/${slug}`} className={classes.join(' ')}>
        <span className="position">
          <span>{entry.Position}</span>
          <FavoriteButton
            playerId={entry.MemberID}
            onChange={onFavorite}
            lastFavoriteChanged={lastFavoriteChanged}
          />
        </span>
        <span>
          {entry.Position ? (
            <span className="position-inline">{entry.Position}</span>
          ) : null}
          {firstName} {lastName}
          <br />
          <span className="club">{entry.ClubName}</span>
          <RaceNote status={raceStatus} />
        </span>
        <span className="score">
          {NUM_FORMATTER.format(Math.round(entry.CalculatedResult))}
        </span>
        <span className="stats">
          <div className="round">
            {Object.values(entry.Results).map(result => {
              return (
                <div
                  key={result.CompetitionID}
                  className={`round-score ${
                    isFirst(result.Position)
                      ? 'first'
                      : isTop10(result.Position)
                      ? 'top-10'
                      : ''
                  }`}
                >
                  {result.Result > 0 ? result.Position : '—'}
                </div>
              );
            })}
          </div>
        </span>
      </Link>
    </li>
  );
}

function cardYear(name) {
  const match = /(\d{4})/.exec(name || '');
  return match ? parseInt(match[1], 10) + 1 : undefined;
}

export function RoadToEuropeSummary({ name, race, remainingEvents, now }) {
  const year = cardYear(name);
  return (
    <section className="oom-race" aria-labelledby="oom-race-title">
      <h3 id="oom-race-title" className="oom-race-title">
        The race for the Challenge Tour
      </h3>
      <p>
        The top {CHALLENGE_TOUR_SPOTS} on the final Road to Europe ranking
        earn a card on the {year ? `${year} ` : ''}HotelPlanner Tour (the
        Challenge Tour).
        {remainingEvents ? (
          remainingEvents.length === 0 ? (
            <> The season is over.</>
          ) : (
            <>
              {' '}
              {remainingEvents.length === 1
                ? 'One event'
                : `${remainingEvents.length} events`}{' '}
              left to play:
            </>
          )
        ) : null}
      </p>
      {remainingEvents && remainingEvents.length > 0 ? (
        <ul className="oom-race-events">
          {remainingEvents.map(c => (
            <li key={c.id}>
              <Link href={`/t/${c.slug}`}>
                {formatCompetitionName(c.name)}
              </Link>{' '}
              <span className="oom-race-event-date">
                {c.venue ? `${c.venue}, ` : ''}
                {competitionDateString(c, now)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {race.qualified.length > 0 ? (
        <p className="oom-race-standing">
          Currently holding the spots:{' '}
          {race.qualified
            .map(
              e =>
                `${normalizeName(e.FirstName)} ${normalizeName(e.LastName)}`,
            )
            .join(', ')}
          .
          {race.chasers.length > 0 ? (
            <>
              {' '}
              {normalizeName(race.chasers[0].FirstName)}{' '}
              {normalizeName(race.chasers[0].LastName)} is first in line,{' '}
              {POINTS_FORMATTER.format(
                race.statusById.get(race.chasers[0].MemberID).behind,
              )}{' '}
              pts back.
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}

export default function OrderOfMeritPage({
  collidingSlugs: collidingSlugsArray = [],
  initialData,
  upcomingCompetitions,
  now: nowMs,
}) {
  const collidingSlugs = useMemo(() => new Map(collidingSlugsArray), [collidingSlugsArray]);
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/${process.env.NEXT_PUBLIC_GOLFBOX_CUSTOMER_ID}/language/2057/OrderOfMeritID/${process.env.NEXT_PUBLIC_GOLFBOX_OOM_ID}/`,
    initialData,
  );

  function handleFavoriteChange() {
    setLastFavoriteChanged(new Date());
  }

  const description =
    data && data.OrderOfMeritData
      ? `Current standings in the ${data.OrderOfMeritData.Name} order of merit.`
      : undefined;
  const entries = data && getEntries(data);
  const favorites = entries && entries.filter(e => e.isFavorite);
  const oomName = data?.OrderOfMeritData?.Name;
  const race =
    entries && isRoadToEurope(oomName) ? getRaceStatus(entries) : undefined;
  const now = nowMs ? new Date(nowMs) : new Date();
  const remainingEvents = upcomingCompetitions
    ? getRemainingEvents(
        upcomingCompetitions.map(c => {
          const copy = { ...c };
          ensureDates(copy);
          return copy;
        }),
      )
    : undefined;
  return (
    <div className="leaderboard-page oom">
      <Head>
        <title>{`Order of Merit ${new Date().getFullYear()} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}</title>
        <meta name="description" content={description || `Order of merit standings for ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`} />
        <meta property="og:title" content={`Order of Merit ${new Date().getFullYear()} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta property="og:description" content={description || `Order of merit standings for ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={`Order of Merit ${new Date().getFullYear()} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta name="twitter:description" content={description || `Order of merit standings for ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`} />
      </Head>
      <h2>Order of merit</h2>
      <p className="page-desc">{description}</p>
      {data ? (
        <>
          {race ? (
            <RoadToEuropeSummary
              name={oomName}
              race={race}
              remainingEvents={remainingEvents}
              now={now}
            />
          ) : null}
          {favorites.length > 0 ? (
            <>
              <h3 className="leaderboard-section-heading">Favorites</h3>
              <ul>
                {favorites.map(entry => {
                  return (
                    <Player
                      key={entry.MemberID}
                      entry={entry}
                      onFavorite={handleFavoriteChange}
                      lastFavoriteChanged={lastFavoriteChanged}
                      collidingSlugs={collidingSlugs}
                      raceStatus={race?.statusById.get(entry.MemberID)}
                    />
                  );
                })}
              </ul>
              <h3 className="leaderboard-section-heading">Everyone</h3>
            </>
          ) : null}

          <ul>
            {entries.map(entry => {
              const player = (
                <Player
                  key={entry.MemberID}
                  entry={entry}
                  onFavorite={handleFavoriteChange}
                  lastFavoriteChanged={lastFavoriteChanged}
                  collidingSlugs={collidingSlugs}
                  raceStatus={race?.statusById.get(entry.MemberID)}
                />
              );
              if (race && entry.MemberID === race.lastQualifiedId) {
                return (
                  <React.Fragment key={entry.MemberID}>
                    {player}
                    <li className="oom-cut-line" aria-hidden="true">
                      <span>Challenge Tour spots above this line</span>
                    </li>
                  </React.Fragment>
                );
              }
              return player;
            })}
          </ul>
        </>
      ) : (
        <LoadingSkeleton />
      )}
    </div>
  );
}
