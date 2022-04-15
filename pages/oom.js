import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';

import { useJsonPData } from '../src/fetchJsonP';
import FavoriteButton from '../src/FavoriteButton';
import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import generateSlug from '../src/generateSlug';

const NUM_FORMATTER = Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

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

function Player({ entry, onFavorite, lastFavoriteChanged }) {
  const classes = ['player'];
  return (
    <li>
      <Link href={`/${generateSlug(entry)}`}>
        <a className={classes.join(' ')}>
          <span className="position">
            <span>{entry.Position}</span>
            <FavoriteButton
              playerId={entry.MemberID}
              onChange={onFavorite}
              lastFavoriteChanged={lastFavoriteChanged}
            />
          </span>
          <span>
            {entry.FirstName} {entry.LastName}
            <br />
            <span className="club">{entry.ClubName}</span>
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
        </a>
      </Link>
    </li>
  );
}

export default function OrderOfMeritPage() {
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const data = useJsonPData(
    'https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/1/language/2057/OrderOfMeritID/157709/',
  );

  function handleFavoriteChange() {
    setLastFavoriteChanged(new Date());
  }

  const entries = data && getEntries(data);
  const favorites = entries && entries.filter(e => e.isFavorite);
  return (
    <div className="leaderboard oom">
      <Head>
        <title>Order of merit</title>
      </Head>
      <Menu />
      <h2>Order of merit</h2>
      {data ? (
        <>
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
                    />
                  );
                })}
              </ul>
              <h3 className="leaderboard-section-heading">Everyone</h3>
            </>
          ) : null}

          <ul>
            {entries.map(entry => {
              return (
                <Player
                  key={entry.MemberID}
                  entry={entry}
                  onFavorite={handleFavoriteChange}
                  lastFavoriteChanged={lastFavoriteChanged}
                />
              );
            })}
          </ul>
        </>
      ) : (
        <LoadingSkeleton />
      )}
    </div>
  );
}
