import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import fetchJsonP from '../src/fetchJsonP';

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

function Player({ entry, onFavorite }) {
  const classes = ['player'];
  if (entry.isFavorite) {
    classes.push('favorite-player');
  }

  return (
    <li className={classes.join(' ')}>
      <span className="position">
        <span>{entry.Position}</span>
        <button
          className="favorite"
          onClick={() => onFavorite(!entry.isFavorite, entry.MemberID)}
        >
          <svg
            height="24px"
            viewBox="0 0 24 24"
            width="24px"
            fill={
              entry.isFavorite
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.2)'
            }
          >
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
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
    </li>
  );
}

export default function OrderOfMeritPage() {
  const [data, setData] = useState();
  useEffect(() => {
    async function run() {
      const url = `https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/1/language/2057/OrderOfMeritID/157709/`;
      const payload = await fetchJsonP(url);
      setData(payload);
    }
    run();
  }, []);

  function handleFavoriteChange(favorite, memberId) {
    if (favorite) {
      localStorage.setItem(memberId, '1');
    } else {
      localStorage.removeItem(memberId);
    }
    setData({ ...data });
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
