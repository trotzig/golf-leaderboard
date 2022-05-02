import { parse, format, startOfDay } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';

import { useJsonPData } from './fetchJsonP';
import ClockIcon from './ClockIcon';
import FavoriteButton from './FavoriteButton';
import Lazy from './Lazy';
import LoadingSkeleton from './LoadingSkeleton';
import Menu from './Menu';
import competitionDateString from './competitionDateString';
import ensureDates from './ensureDates.js';
import fixParValue from './fixParValue';
import generateSlug from './generateSlug.mjs';

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
  return entries;
}

function getEntriesFromPlayersData(playersData) {
  return Object.values(Object.values(playersData.Classes)[0].Entries).filter(
    p => {
      return p.PlayerStatus === 1;
    },
  );
}

function getEntries(data, timesData, playersData) {
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
    entries = timeEntries;
  }
  if (!Object.keys(entries).length) {
    entries = getEntriesFromPlayersData(playersData);
  }

  const result = Object.values(entries);
  for (const entry of result) {
    const timeEntry = timeEntries[entry.MemberID];
    if (timeEntry) {
      entry.activeRoundNumber = timeEntry.activeRoundNumber;
      entry.Rounds = { ...timeEntry.Rounds, ...entry.Rounds };
    }
  }
  return result;
}

function getRounds(entry) {
  if (!entry.Rounds) {
    return [];
  }
  const roundKeys = Object.keys(entry.Rounds);
  return roundKeys.map(key => entry.Rounds[key]);
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
            : score.Result.ActualValue === 1
            ? 'hio'
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

function Player({
  entry,
  onFavoriteChange,
  lastFavoriteChanged,
  colors,
  now,
  lazy,
  competitionId,
}) {
  const rounds = getRounds(entry);
  const classes = ['player'];
  if (entry.isFavorite) {
    classes.push('favorite-player');
  }

  if (!entry.Position && rounds.length === 0) {
    classes.push('player-entry-only');
  }

  const positionClassname =
    entry.Position && entry.Position.Calculated.length > 3
      ? 'position position-long-text'
      : 'position';

  const StatsWrapper = lazy ? Lazy : 'div';
  const statsHeight =
    window.innerWidth < 400 ? 14 * rounds.length : 17 * rounds.length;

  return (
    <li className={classes.join(' ')}>
      <Link
        href={
          rounds.length > 0
            ? `/competitions/${competitionId}/players/${entry.MemberID}`
            : `/${generateSlug(entry)}`
        }
      >
        <a>
          <span className={positionClassname}>
            <span>
              {entry.Position ? (
                entry.Position.Calculated
              ) : rounds.length > 0 ? (
                <ClockIcon
                  date={getFirstRoundStart(
                    rounds[entry.activeRoundNumber - 1],
                    now,
                  )}
                />
              ) : null}
            </span>
            <FavoriteButton
              playerId={entry.MemberID}
              onChange={onFavoriteChange}
              icon
              lastFavoriteChanged={lastFavoriteChanged}
            />
          </span>
          <span>
            {entry.FirstName} {entry.LastName}
            <br />
            <span className="club">{entry.ClubName}</span>
          </span>
          {entry.ResultSum ? (
            <span
              className={`score${
                entry.ResultSum.ToParValue < 0 ? ' under-par' : ''
              }`}
            >
              {fixParValue(entry.ResultSum.ToParText)}
            </span>
          ) : null}
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
        </a>
      </Link>
    </li>
  );
}

function getHeading(competition, now) {
  if (!competition.start) {
    // not yet loaded
    return '';
  }
  const startOfToday = startOfDay(now);
  if (competition.start > startOfToday) {
    return 'Upcoming event';
  }
  if (competition.end >= startOfToday) {
    return 'Leaderboard';
  }
  return 'Final results';
}

export default function CompetitionPage({
  initialData,
  initialTimesData,
  initialPlayersData,
  loadingOverride,
  competition = {},
  now = new Date(),
  lazyItems = true,
}) {
  ensureDates(competition);
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
    initialData,
  );
  const timesData = useJsonPData(
    `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competition.id}/language/2057/`,
    initialTimesData,
  );
  const playersData = useJsonPData(
    `https://scores.golfbox.dk/Handlers/PlayersHandler/GetPlayers/CompetitionId/${competition.id}/language/2057/`,
    initialPlayersData,
  );
  const loading = loadingOverride || !data || !timesData || !playersData;

  function handleFavoriteChange() {
    setLastFavoriteChanged(new Date());
  }

  const entries =
    data && timesData && playersData
      ? getEntries(data, timesData, playersData)
      : [];

  for (const entry of entries || []) {
    entry.isFavorite = localStorage.getItem(entry.MemberID);
  }

  const favorites = entries && entries.filter(e => e.isFavorite);
  return (
    <div className="leaderboard">
      <Head>
        <title>
          {competition.name} | {getHeading(competition, now)}
        </title>
      </Head>
      <Menu activeHref="/leaderboard" />
      <div className="h-intro">{getHeading(competition, now)}</div>
      <h2 className="leaderboard-heading">{competition.name}</h2>
      {competition.venue && (
        <p className="leaderboard-subtitle">
          {competition.venue} –{' '}
          {competition.start && competitionDateString(competition, now)}
        </p>
      )}
      {data && (
        <>
          {Object.values(data.Courses || {}).length > 0 ? (
            <div className="courses">
              {Object.values(data.CourseColours || {}).map(course => {
                return (
                  <div key={course.CourseID}>
                    <Link
                      href={`/competitions/${competition.id}/courses/${course.CourseID}`}
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
        <p className="alert page-margin">
          {competition.start < now
            ? 'Failed to load leaderboard. This is most likely a temporary issue -- come back here in a while and see if things are back to normal!'
            : "This competition hasn't started yet. Come back here later to see tee times and an updated leaderboard."}
        </p>
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
                      competitionId={competition.id}
                      now={now}
                      colors={data.CourseColours}
                      key={entry.MemberID}
                      entry={entry}
                      onFavoriteChange={handleFavoriteChange}
                      lastFavoriteChanged={lastFavoriteChanged}
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
                  competitionId={competition.id}
                  now={now}
                  colors={data.CourseColours}
                  key={entry.MemberID}
                  entry={entry}
                  onFavoriteChange={handleFavoriteChange}
                  lazy={lazyItems && i > 20}
                  lastFavoriteChanged={lastFavoriteChanged}
                />
              );
            })}
          </ul>
        </div>
      ) : null}
      {loading && <LoadingSkeleton />}
    </div>
  );
}
