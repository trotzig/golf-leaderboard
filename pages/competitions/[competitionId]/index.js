import { parse, format } from 'date-fns';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import ClockIcon from '../../../src/ClockIcon';
import Menu from '../../../src/Menu';
import fetchJsonP from '../../../src/fetchJsonP';

function pluralizeRounds(count) {
  if (count === 1) {
    return 'one round';
  }
  return `${count} rounds`;
}

function removeCommonPrefix(courses, courseName) {
  if (courses.length === 1) {
    return courseName;
  }
  const names = courses.map(c => c.Name);
  names.sort((a, b) => a.length - b.length);
  const lastMatch = (() => {
    let i;
    for (i = 0; i < names[0].length; i++) {
      const refChar = names[0][i];
      for (const name of names) {
        if (name[i] !== refChar) {
          return i;
        }
      }
    }
    return i;
  })();

  return courseName.slice(lastMatch);
}
function getEntriesFromTimesData(timesData) {
  if (!timesData.ActiveRoundNumber) {
    return {};
  }
  const entries = [];
  const round = timesData.Rounds[`R${timesData.ActiveRoundNumber}`];
  const startTimeIndex = {};
  for (const startList of Object.values(round.StartLists)) {
    entries.push(...startList.Entries);
  }
  for (const round of Object.values(timesData.Rounds)) {
    for (const startList of Object.values(round.StartLists)) {
      for (const entry of Object.values(startList.Entries)) {
        startTimeIndex[`R${round.Number}-${entry.MemberID}`] = entry.StartTime;
      }
    }
  }

  for (const entry of entries) {
    entry.Rounds = {};
    for (const roundKey of Object.keys(timesData.Rounds)) {
      entry.Rounds[roundKey] = {
        StartDateTime: startTimeIndex[`${roundKey}-${entry.MemberID}`],
      };
    }
    entry.ResultSum = { ToParValue: 0, ToParText: 'E' };
    entry.activeRoundNumber = timesData.ActiveRoundNumber;
  }
  entries.sort((a, b) => {
    const aStart = a.Rounds[`R${a.activeRoundNumber}`].StartDateTime;
    const bStart = b.Rounds[`R${b.activeRoundNumber}`].StartDateTime;
    if (aStart > bStart) {
      return 1;
    }
    if (aStart < bStart) {
      return -1;
    }
    return 0;
  });
  const result = {};
  for (const entry of entries) {
    result[entry.MemberID] = entry;
  }
  return result;
}

function getEntries(data, timesData) {
  if (!data.Classes) {
    return;
  }
  const classKey = Object.keys(data.Classes)[0];
  let entries = data.Classes[classKey].Leaderboard.Entries;
  if (!entries && !timesData) {
    return;
  }
  const timeEntries = getEntriesFromTimesData(timesData);
  if (!entries) {
    // hasn't started yet, show start times
    entries = Object.values(timeEntries);
  }
  const entryKeys = Object.keys(entries);
  const result = entryKeys.map(key => entries[key]);
  for (const entry of result) {
    entry.isFavorite = localStorage.getItem(entry.MemberID);
    const timeEntry = timeEntries[entry.MemberID];
    if (timeEntry) {
      entry.activeRoundNumber = timeEntry.activeRoundNumber;
      entry.Rounds = { ...timeEntry.Rounds, ...entry.Rounds };
    }
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

function Round({ round, colors }) {
  const now = new Date();
  const startTime = parse(round.StartDateTime, "yyyyMMdd'T'HHmmss", now);

  const classes = ['round'];
  const color = Object.values(colors || {}).find(
    c => c.CourseID === round.CourseRefID,
  );
  if (color) {
    classes.push(color.CssName);
  }
  return (
    <div className={classes.join(' ')}>
      {now < startTime || !round.Holes ? (
        <div className="round-start-time">{format(startTime, 'HH:mm')}</div>
      ) : (
        Object.keys(round.Holes || {}).map((holeKey, i) => {
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

function Player({ entry, onFavoriteChange, colors }) {
  const rounds = getRounds(entry);
  const classes = ['player'];
  if (entry.isFavorite) {
    classes.push('favorite-player');
  }

  return (
    <li className={classes.join(' ')}>
      <span className="position">
        <span>
          {(entry.Position && entry.Position.Calculated) || (
            <ClockIcon
              date={getFirstRoundStart(rounds[entry.activeRoundNumber - 1])}
            />
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
      <span className="stats">
        {rounds.map(round => {
          return <Round key={round.RefID} round={round} colors={colors} />;
        })}
      </span>
    </li>
  );
}

export default function CompetitionPage() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [timesData, setTimesData] = useState();
  const [entries, setEntries] = useState();
  const router = useRouter();
  const { competitionId } = router.query;

  function handleFavoriteChange(favorite, memberId) {
    if (favorite) {
      localStorage.setItem(memberId, '1');
    } else {
      localStorage.removeItem(memberId);
    }
    setEntries(getEntries(data, timesData));
  }

  useEffect(() => {
    if (!competitionId) {
      return;
    }
    async function run() {
      setLoading(true);
      const [compPayload, timesPayload] = await Promise.all([
        fetchJsonP(
          `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
        ),
        fetchJsonP(
          `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competitionId}/language/2057/`,
        ),
      ]);
      console.log(compPayload, timesPayload);
      setData(compPayload);
      setTimesData(timesPayload);
      setEntries(getEntries(compPayload, timesPayload));
      setLoading(false);
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
        <>
          <p className="leaderboard-subtitle">
            {data.CompetitionData.Name} – {data.CompetitionData.Venue.Name}
            {timesData && timesData.Rounds ? (
              <span>
                {' '}
                – {pluralizeRounds(Object.keys(timesData.Rounds).length)}
              </span>
            ) : null}
          </p>
          {Object.values(data.Courses).length > 0 ? (
            <div className="courses">
              {Object.values(data.CourseColours || {}).map(course => {
                return (
                  <div key={course.CourseID}>
                    <Link
                      href={`/competitions/${competitionId}/courses/${course.CourseID}`}
                    >
                      <a className={course.CssName}>
                        {removeCommonPrefix(
                          Object.values(data.CourseColours),
                          course.Name,
                        )}
                      </a>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
      {!loading &&
        (!timesData || typeof timesData.ActiveRoundNumber !== 'number') && (
          <p className="alert">This competition hasn't started yet</p>
        )}
      {entries ? (
        <div>
          {favorites && favorites.length ? (
            <div>
              <h3 className="leaderboard-section-heading">Favorites</h3>
              <ul>
                {favorites.map(entry => {
                  return (
                    <Player
                      colors={data.CourseColours}
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
                  colors={data.CourseColours}
                  key={entry.MemberID}
                  entry={entry}
                  onFavoriteChange={handleFavoriteChange}
                />
              );
            })}
          </ul>
        </div>
      ) : null}
      {loading && (
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
