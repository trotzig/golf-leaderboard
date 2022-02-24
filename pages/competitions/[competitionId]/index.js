import { parse, format } from 'date-fns';
import { useRouter } from 'next/router';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import ClockIcon from '../../../src/ClockIcon';
import Menu from '../../../src/Menu';
import fetchJsonP from '../../../src/fetchJsonP';

function getEntries(data) {
  if (!data.Classes) {
    return;
  }
  const classKey = Object.keys(data.Classes)[0];
  const entries = data.Classes[classKey].Leaderboard.Entries;
  if (!entries) {
    return;
  }
  const entryKeys = Object.keys(entries);
  const result = entryKeys.map(key => entries[key]);
  for (const entry of result) {
    entry.isFavorite = localStorage.getItem(entry.MemberID);
  }
  return result;
}

function getRounds(entry) {
  const roundKeys = Object.keys(entry.Rounds);
  return roundKeys.map(key => entry.Rounds[key]);
}

function fixParValue(val) {
  if (val === 'Par') {
    return 'E';
  }
  return val;
}

function RoundTotal({ score }) {
  const classes = ['round-score', 'round-total'];
  if (score && score.Result.ToPar < 0) {
    classes.push('under-par');
  }
  return (
    <span className={classes.join(' ')}>{score && score.Result.Actual}</span>
  );
}

function Round({ round }) {
  const now = new Date();
  const startTime = parse(round.StartDateTime, "yyyyMMdd'T'HHmmss", now);

  return (
    <div className="round">
      {now < startTime ? (
        <div className="round-start-time">{format(startTime, 'HH:mm')}</div>
      ) : (
        Object.keys(round.Holes).map((holeKey, i) => {
          const score = round.HoleScores[holeKey];
          const toParClass = !score
            ? 'unknown'
            : score.Result.ToParValue < -1
            ? 'eagle'
            : score.Result.ToParValue < 0
            ? 'birdie'
            : score.Result.ToParValue > 1
            ? 'bogey-plus'
            : score.Result.ToParValue > 0
            ? 'bogey'
            : 'on-par';
          const result = [
            <span key={holeKey} className={`round-score ${toParClass}`}>
              {score ? score.Result.ActualText : '-'}
            </span>,
          ];
          if (i === 8) {
            result.push(
              <RoundTotal score={round.HoleScores['H-OUT']} key="out" />,
            );
          }
          if (i === 17) {
            result.push(
              <RoundTotal score={round.HoleScores['H-IN']} key="in" />,
            );
            result.push(
              <RoundTotal score={round.HoleScores['H-TOTAL']} key="total" />,
            );
          }
          return result;
        })
      )}
    </div>
  );
}

function getFirstRoundStart(round) {
  const now = new Date();
  const startTime = parse(round.StartDateTime, "yyyyMMdd'T'HHmmss", now);
  return startTime;
}

function Player({ entry, onFavoriteChange }) {
  const rounds = getRounds(entry);
  const classes = ['player'];
  if (entry.isFavorite) {
    classes.push('favorite-player');
  }

  return (
    <li className={classes.join(' ')}>
      <span className="position">
        <span>
          {entry.Position.Calculated || (
            <ClockIcon date={getFirstRoundStart(rounds[0])} />
          )}
        </span>
        <button
          className="favorite"
          onClick={() => onFavoriteChange(!entry.isFavorite, entry.MemberID)}
        >
          <svg height="24px" viewBox="0 0 24 24" width="24px">
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
      <span
        className={`score${entry.ResultSum.ToParValue < 0 ? ' under-par' : ''}`}
      >
        {fixParValue(entry.ResultSum.ToParText)}
      </span>
      <span className="stats" style={{ maxHeight: open ? 100 : 0 }}>
        {rounds.map(round => {
          return <Round key={round.RefID} round={round} />;
        })}
      </span>
    </li>
  );
}

export default function CompetitionPage() {
  const [data, setData] = useState();
  const [entries, setEntries] = useState();
  const router = useRouter();
  const { competitionId } = router.query;

  function handleFavoriteChange(favorite, memberId) {
    if (favorite) {
      localStorage.setItem(memberId, '1');
    } else {
      localStorage.removeItem(memberId);
    }
    setEntries(getEntries(data));
  }

  useEffect(() => {
    if (!competitionId) {
      return;
    }
    async function run() {
      const url = `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`;
      const payload = await fetchJsonP(url);
      setData(payload);
      setEntries(getEntries(payload));
    }
    run();
  }, [competitionId]);

  const favorites = entries && entries.filter(e => e.isFavorite);
  return (
    <div className="leaderboard">
      <Head>
        <title>
          Leaderboard
          {data && ` | ${data.CompetitionData.Name}`}
        </title>
      </Head>
      <Menu />
      <h2>Leaderboard</h2>
      {data && (
        <p className="leaderboard-subtitle">
          {data.CompetitionData.Name} – {data.CompetitionData.Venue.Name}
        </p>
      )}
      {data && !entries ? (
        <p className="alert">This competition hasn't started yet</p>
      ) : entries ? (
        <div>
          {favorites && favorites.length ? (
            <div>
              <h3 className="leaderboard-section-heading">Favorites</h3>
              <ul>
                {favorites.map(entry => {
                  return (
                    <Player
                      key={entry.RefID}
                      entry={entry}
                      onFavoriteChange={handleFavoriteChange}
                    />
                  );
                })}
              </ul>
              <h3 className="leaderboard-section-heading">Everyone</h3>
            </div>
          ) : null}

          <ul>
            {entries.map(entry => {
              return (
                <Player
                  key={entry.RefID}
                  entry={entry}
                  onFavoriteChange={handleFavoriteChange}
                />
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      )}
    </div>
  );
}
