import { parse, format, startOfDay } from 'date-fns';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import ClockIcon from '../../../src/ClockIcon';
import Lazy from '../../../src/Lazy';
import Menu from '../../../src/Menu';
import competitionDateString from '../../../src/competitionDateString';
import fetchJsonP from '../../../src/fetchJsonP';

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

function parseAndFormatDate(dateStr) {
  const d = parse(dateStr, DATE_FORMAT, new Date());
  return format(d, 'MMMM d');
}

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

function Round({ round, colors, now }) {
  const startTime = parse(round.StartDateTime, DATE_FORMAT, now);

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

function getFirstRoundStart(round, now) {
  const startTime = parse(round.StartDateTime, DATE_FORMAT, now);
  return startTime;
}

function Player({ entry, onFavoriteChange, colors, now, i }) {
  const rounds = getRounds(entry);
  const classes = ['player'];
  if (entry.isFavorite) {
    classes.push('favorite-player');
  }

  const positionClassname =
    entry.Position && entry.Position.Calculated.length > 3
      ? 'position position-long-text'
      : 'position';

  const StatsWrapper = i > 20 ? Lazy : 'div';
  const statsHeight =
    window.innerWidth < 400 ? 14 * rounds.length : 17 * rounds.length;

  return (
    <li className={classes.join(' ')}>
      <span className={positionClassname}>
        <span>
          {(entry.Position && entry.Position.Calculated) || (
            <ClockIcon
              date={getFirstRoundStart(
                rounds[entry.activeRoundNumber - 1],
                now,
              )}
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
      <StatsWrapper className="stats" minHeight={statsHeight}>
        {rounds.map(round => {
          return (
            <Round
              key={round.StartDateTime}
              round={round}
              colors={colors}
              now={now}
            />
          );
        })}
      </StatsWrapper>
    </li>
  );
}

function getHeading(data, finishedQueryParam) {
  if (!data || !data.CompetitionData) {
    if (finishedQueryParam) {
      return 'Results';
    }
    return 'Leaderboard';
  }

  const startOfToday = startOfDay(new Date());
  const end = parse(data.CompetitionData.EndDate, DATE_FORMAT, new Date());
  if (end >= startOfToday) {
    return 'Leaderboard';
  }
  return 'Results';
}

export default function CompetitionPage({
  initialData,
  initialTimesData,
  initialLoading = true,
  now = startOfDay(new Date()),
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialLoading);
  const [timesData, setTimesData] = useState(initialTimesData);
  const router = useRouter();
  const { competitionId, finished } = router ? router.query : {};

  function handleFavoriteChange(favorite, memberId) {
    if (favorite) {
      localStorage.setItem(memberId, '1');
    } else {
      localStorage.removeItem(memberId);
    }
    setData({ ...data });
    setTimesData({ ...timesData });
  }

  useEffect(() => {
    if (!competitionId) {
      return;
    }
    async function run() {
      const [compPayload, timesPayload] = await Promise.all([
        fetchJsonP(
          `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
        ),
        fetchJsonP(
          `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competitionId}/language/2057/`,
        ),
      ]);
      setData(compPayload);
      setTimesData(timesPayload);
      setLoading(false);
      console.log({ initialTimesData: timesPayload, initialData: compPayload });
    }
    run();
  }, [competitionId]);

  const entries = data && timesData ? getEntries(data, timesData) : [];
  const favorites = entries && entries.filter(e => e.isFavorite);
  return (
    <div className="leaderboard">
      <Head>
        <title>
          {getHeading(data, finished)}
          {data && ` | ${data.CompetitionData.Name}`}
        </title>
      </Head>
      <Menu />
      <h2>{getHeading(data, finished)}</h2>
      {data && (
        <>
          <p className="leaderboard-subtitle">
            {data.CompetitionData.Name} – {data.CompetitionData.Venue.Name}
          </p>
          <p className="leaderboard-dates">
            {competitionDateString(data.CompetitionData, now)}
          </p>
          {Object.values(data.Courses || {}).length > 0 ? (
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
      {!loading && (!timesData || !timesData.ActiveRoundNumber) && (
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
                      now={now}
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
            {entries.map((entry, i) => {
              return (
                <Player
                  now={now}
                  colors={data.CourseColours}
                  key={entry.MemberID}
                  entry={entry}
                  onFavoriteChange={handleFavoriteChange}
                  i={i}
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
