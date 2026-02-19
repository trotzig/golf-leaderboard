import { format, startOfDay } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import PlayerPhoto from './PlayerPhoto';
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
import parseCET from './parseCET';
import removeCommonCoursePrefix from './removeCommonCoursePrefix.js';
import YouTubeEmbed from './YouTubeEmbed';

function parseAndFormatDate(dateStr) {
  const d = parseCET(dateStr);
  return format(d, 'MMMM d');
}

/**
 * Extract the HH:mm start time directly from a CET datetime string.
 * This avoids timezone conversion so the displayed time is always CET.
 */
function formatCETTime(dateStr) {
  if (!dateStr || dateStr.length < 13) return '';
  return `${dateStr.slice(9, 11)}:${dateStr.slice(11, 13)}`;
}

function pluralizeRounds(count) {
  if (count === 1) {
    return 'one round';
  }
  return `${count} rounds`;
}

function getIndexedEntriesFromTimesData(timesData) {
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

function getIndexedEntriesFromPlayersData(playersData) {
  if (!playersData.Classes) {
    return {};
  }
  const result = {};
  for (const entry of Object.values(
    Object.values(playersData.Classes)[0].Entries,
  ).filter(p => {
    return p.PlayerStatus === 1;
  })) {
    result[entry.MemberID] = entry;
  }
  return result;
}

function getEntries(data, timesData, playersData) {
  const classKey = Object.keys(data.Classes || {})[0];
  let entries = classKey
    ? data.Classes[classKey].Leaderboard.Entries
    : undefined;
  if (!entries && !timesData) {
    return;
  }
  const indexedTimeEntries = getIndexedEntriesFromTimesData(timesData);
  if (!entries) {
    // hasn't started yet, show start times
    entries = indexedTimeEntries;
  }
  if (!Object.keys(entries).length) {
    entries = getIndexedEntriesFromPlayersData(playersData);
  }

  const result = Object.values(entries);
  const cutPosition =
    data.Classes &&
    data.Classes[classKey].Cut &&
    data.Classes[classKey].Cut.Position;
  for (const entry of result) {
    if (
      cutPosition &&
      entry.Position &&
      entry.Position.Actual - 1 === cutPosition
    ) {
      entry.isFirstCut = true;
      entry.isFirstCutPerformed = data.Classes[classKey].Cut.IsPerformed;
    }
    const timeEntry = indexedTimeEntries[entry.MemberID];
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
  if (score && score.Score < score.Par) {
    classes.push('under-par');
  }
  return (
    <span className={classes.join(' ')}>
      {score && score.Score > 0 ? score.Score : null}
    </span>
  );
}

function Round({ round, colors, now }) {
  const startTime = parseCET(round.StartDateTime);

  const classes = ['round'];
  const courseColors = Object.values(colors || {});
  const color = courseColors.find(c => c.CourseID === round.CourseRefID);
  if (color && courseColors.length > 1) {
    classes.push(color.CssName);
  }
  return (
    <div className={classes.join(' ')}>
      {now < startTime || !round.Holes ? (
        <div className="round-start-time">
          {formatCETTime(round.StartDateTime)}
        </div>
      ) : (
        Object.keys(round.Holes || {}).map((holeKey, i) => {
          const score = round.HoleScores[holeKey];
          const toParClass = !score
            ? 'unknown'
            : score.Score.Value === 1
            ? 'hio'
            : score.Score.Value < score.Par - 1
            ? 'eagle'
            : score.Score.Value < score.Par
            ? 'birdie'
            : score.Score.Value > score.Par + 1
            ? 'bogey-plus'
            : score.Score.Value > score.Par
            ? 'bogey'
            : 'on-par';
          const result = [
            <span key={holeKey} className={`round-score ${toParClass}`}>
              {score ? score.Score.Value : '-'}
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
  return parseCET(round.StartDateTime);
}

function Player({
  big,
  entry,
  onFavoriteChange,
  lastFavoriteChanged,
  colors,
  now,
  lazy,
  competition,
}) {
  const rounds = getRounds(entry);
  const classes = ['player'];
  if (entry.isFavorite) {
    classes.push('favorite-player');
  }

  if (!entry.Position && rounds.length === 0) {
    classes.push('player-entry-only');
  }

  if (entry.isFirstCut) {
    classes.push('player-entry-first-cut');
  }
  if (entry.isFirstCutPerformed) {
    classes.push('player-entry-first-cut-performed');
  }
  if (big) {
    classes.push('player-entry-big');
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
      {entry.isFirstCut ? <span id="cut" /> : null}
      {big ? (
        <Link href={`/${generateSlug(entry)}`} className="player-big-position">
          <PlayerPhoto player={entry} />
          <div>
            <h2 className="player-big-name">
              {entry.FirstName} {entry.LastName}
            </h2>
            <div className="player-big-club">
              {entry.ClubName}
              {process.env.NEXT_PUBLIC_SHOW_PHCP
                ? ` — HCP ${entry.PHCP}`
                : null}
            </div>
          </div>
          <span className="player-big-score">
            {fixParValue(entry.ResultSum.ToParText)}
          </span>
        </Link>
      ) : null}
      <Link
        href={
          rounds.length > 0 && rounds[0].Holes
            ? `/t/${competition.slug}/players/${entry.MemberID}`
            : `/${generateSlug(entry)}`
        }
        className="player-link"
      >
        {!big ? (
          <span className={positionClassname}>
            <span>
              {entry.Position && entry.Position.Calculated ? (
                entry.Position.Calculated
              ) : rounds && rounds.length > 0 ? (
                <ClockIcon
                  date={getFirstRoundStart(rounds[rounds.length - 1])}
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
        ) : null}
        {!big ? (
          <span>
            {entry.FirstName} {entry.LastName}
            <br />
            <span className="club">
              {entry.ClubName}
              {process.env.NEXT_PUBLIC_SHOW_PHCP
                ? ` — HCP ${entry.PHCP}`
                : null}
            </span>
          </span>
        ) : null}
        {entry.ResultSum && !big ? (
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
      </Link>
    </li>
  );
}

function getHeading(competition, now, finished) {
  if (!competition.start) {
    // not yet loaded
    return '';
  }
  if (finished) {
    return 'Final results';
  }
  if (competition.start > now) {
    return 'Upcoming event';
  }
  const startOfToday = startOfDay(now);
  if (competition.end >= startOfToday) {
    return 'Leaderboard';
  }
  return 'Final results';
}

function formatProjectedScore(value) {
  const rounded = Math.round(value);
  if (rounded === 0) return 'E';
  if (rounded > 0) return `+${rounded}`;
  return `${rounded}`;
}

function getCutConfig(data) {
  const classes = data.CompetitionData && data.CompetitionData.Classes;
  if (!classes || !classes.length) {
    return null;
  }
  return classes[0].Cut;
}

function getProjectedCutScore(cutConfig, cut, entries) {
  if (!cutConfig || !cutConfig.Enabled || !cutConfig.Limit || !entries) {
    return null;
  }
  const afterRound = cut.AfterRound || cutConfig.AfterRound;
  if (!afterRound) {
    return null;
  }
  const cutEntry = entries.find(
    e => e.Position && e.Position.Actual === cutConfig.Limit,
  );
  if (!cutEntry || !cutEntry.ScoringToPar) {
    return null;
  }
  const holesCompleted = cutEntry.ScoringToPar.HoleValue;
  if (!holesCompleted) {
    return null;
  }
  const currentScore = cutEntry.ScoringToPar.ToParValue / 10000;
  const totalHoles = afterRound * 18;
  const projected = currentScore * (totalHoles / holesCompleted);
  return formatProjectedScore(projected);
}

function getActualCutScore(entries, cutPosition) {
  if (!cutPosition || !entries) {
    return null;
  }
  // The last player who made the cut
  const cutEntry = entries.find(
    e => e.Position && e.Position.Actual === cutPosition,
  );
  if (!cutEntry || !cutEntry.ResultSum) {
    return null;
  }
  return fixParValue(cutEntry.ResultSum.ToParText);
}

function CutInfo({ data, entries }) {
  if (!data) {
    return null;
  }
  const clazz = Object.values(data.Classes || {})[0];
  if (!clazz) {
    return null;
  }
  const cut = clazz.Cut;
  if (!cut || !cut.AfterRound) {
    return null;
  }

  const cutConfig = getCutConfig(data);
  if (!cutConfig || !cutConfig.Enabled) {
    return null;
  }

  const activeRound = clazz.Leaderboard && clazz.Leaderboard.ActiveRoundNumber;

  // Don't show before competition has started
  if (!activeRound) {
    return null;
  }

  const cutDone = cut.IsPerformed || activeRound > cut.AfterRound;
  const cutInProgress = activeRound === cut.AfterRound && !cut.IsPerformed;

  const playersInsideCut = cutDone
    ? cut.Position
    : entries
    ? entries.filter(e => e.Position && e.Position.Actual <= cutConfig.Limit)
        .length
    : null;

  let cutScore = null;
  if (cutDone) {
    cutScore = getActualCutScore(entries, cut.Position);
  } else {
    cutScore = getProjectedCutScore(cutConfig, cut, entries);
  }

  return (
    <div className="cut-info">
      <h3 className="cut-info-heading">Cut info</h3>
      <p className="cut-info-body">
        {cutDone ? (
          <>
            {playersInsideCut != null && (
              <>
                <strong>
                  <a href="#cut">{playersInsideCut} players</a>
                </strong>{' '}
                made the cut after round {cut.AfterRound}.{' '}
              </>
            )}
            {cutScore != null && (
              <>The score required to make the cut was {cutScore}.</>
            )}
          </>
        ) : (
          <>
            {playersInsideCut != null && (
              <>
                <strong>
                  <a href="#cut">{playersInsideCut} players</a>
                </strong>{' '}
                are currently inside the cut line
                {cutScore != null ? (
                  <> which is projected to be at {cutScore}</>
                ) : null}
                .{' '}
              </>
            )}
            Top {cutConfig.Limit} players and ties make the cut after round{' '}
            {cut.AfterRound}.
          </>
        )}
      </p>
    </div>
  );
}

function MatchPlay({ entries }) {
  return (
    <div>
      <h3 className="leaderboard-section-heading">Matches</h3>
      <ul>
        {entries.map(entry => {
          return (
            <li className="match" key={entry.MatchNo}>
              <span>
                {entry.Players[0].FirstName} {entry.Players[0].LastName}
                <br />
                <span className="club">{entry.Players[0].ClubName}</span>
              </span>

              <div className="round-start-time">
                {formatCETTime(entry.StartTime)}
              </div>

              <span>
                {entry.Players[1].FirstName} {entry.Players[1].LastName}
                <br />
                <span className="club">{entry.Players[1].ClubName}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function isCompetitionFinished(competitionData) {
  return competitionData && competitionData.DefaultAction === 'finalresults';
}

function getWinner(entries) {
  if (!entries || !entries.length) {
    return;
  }
  return entries.find(
    e =>
      e.Position && (e.Position.Calculated === '1' || e.Position.Actual === 1),
  );
}

function getFinishedResult(data) {
  if (!data) {
    return;
  }
  if (!data.CompetitionData) {
    return;
  }

  const lss = data.CompetitionData.LivescoringSettings;
  if (!lss) {
    return;
  }

  const cs = lss.ClassSettings[0];
  if (!cs) {
    return;
  }

  if (cs.StatusType !== 4) {
    return;
  }

  if (!cs.StatusText) {
    return;
  }

  // Check if the status text contains a YouTube URL
  const youtubeUrlMatch = cs.StatusText.match(
    /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?"#]+))/,
  );
  if (youtubeUrlMatch) {
    return {
      text: cs.StatusText,
      youtubeUrl: youtubeUrlMatch[0],
      youtubeId: youtubeUrlMatch[2],
    };
  }

  return {
    text: cs.StatusText,
  };
}

export default function CompetitionPage({
  initialData,
  initialTimesData,
  initialPlayersData,
  initialCompetitionData,
  loadingOverride,
  account,
  competition = {},
  now: nowMs = Date.now(),
  lazyItems = true,
}) {
  ensureDates(competition);
  const now = new Date(nowMs);
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
  const competitionData = useJsonPData(
    `https://scores.golfbox.dk/Handlers/CompetitionHandler/GetCompetition/CompetitionId/${competition.id}/language/2057/`,
    initialCompetitionData,
  );
  const loading = loadingOverride || !data || !timesData || !playersData;

  function handleFavoriteChange() {
    setLastFavoriteChanged(new Date());
  }

  const finishedResult = getFinishedResult(data);
  const entries =
    data && timesData && playersData
      ? getEntries(data, timesData, playersData)
      : [];

  const isMatchPlay = entries && entries[0] && entries[0].Players;
  const finished = isCompetitionFinished(competitionData);
  const winner = finished ? getWinner(entries) : undefined;

  for (const entry of entries || []) {
    entry.isFavorite = localStorage.getItem(entry.MemberID);
  }

  const favorites = entries && entries.filter(e => e.isFavorite);
  return (
    <div className="leaderboard-page">
      <Head>
        <title>
          {competition.name} | {getHeading(competition, now, finished)}
        </title>
        <meta
          name="description"
          content={`Follow the leaderboard and see tee times for ${competition.name}`}
        />
        {finishedResult?.youtubeId && (
          <meta
            property="og:image"
            content={`https://img.youtube.com/vi/${finishedResult.youtubeId}/maxresdefault.jpg`}
          />
        )}
      </Head>
      <Menu activeHref="/leaderboard" />
      <div className="h-intro">{getHeading(competition, now, finished)}</div>
      <h2 className="leaderboard-page-heading">{competition.name}</h2>
      {competition.venue && (
        <p className="leaderboard-page-subtitle">
          {competition.venue} –{' '}
          {competition.start &&
            competitionDateString(competition, now, { finished })}
          .
        </p>
      )}
      <CutInfo data={data} entries={entries} />
      <p className="leaderboard-page-subtitle">
        Switch to{' '}
        <Link href={`/t/${competition.slug}/tee-times`}>tee times</Link>.
      </p>
      {data && (
        <>
          {Object.values(data.Courses || {}).length > 1 ? (
            <div className="courses">
              {Object.values(data.CourseColours || {}).map(course => {
                return (
                  <div key={course.CourseID}>
                    <Link
                      href={`/t/${competition.slug}/courses/${course.CourseID}`}
                      className={course.CssName}
                    >
                      {removeCommonCoursePrefix(
                        Object.values(data.CourseColours),
                        course.Name,
                      )}
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

      {finishedResult ? (
        <div className="page-margin alert">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(finishedResult.text),
            }}
          />
          {finishedResult.youtubeUrl && (
            <YouTubeEmbed videoId={finishedResult.youtubeId} />
          )}
        </div>
      ) : null}
      {winner && (
        <div className="winner">
          <h3 className="winner-heading">Winner</h3>
          <ul>
            <Player
              big={true}
              competition={competition}
              now={now}
              colors={data.CourseColours}
              entry={winner}
              onFavoriteChange={handleFavoriteChange}
              lastFavoriteChanged={lastFavoriteChanged}
            />
          </ul>
        </div>
      )}
      {entries && isMatchPlay ? (
        <MatchPlay entries={entries} />
      ) : entries ? (
        <div>
          {favorites && favorites.length ? (
            <div>
              <h3 className="leaderboard-section-heading">Favorites</h3>
              <ul>
                {favorites.map(entry => {
                  return (
                    <Player
                      competition={competition}
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
          ) : (
            <h3 className="leaderboard-section-heading">Players</h3>
          )}

          <ul>
            {entries.map((entry, i) => {
              return (
                <Player
                  key={entry.MemberID}
                  competition={competition}
                  now={now}
                  colors={data.CourseColours}
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
      {account && account.isAdmin ? (
        <div className="admin-buttons">
          <h3>Admin buttons</h3>
          <form
            method="POST"
            action={`/api/admin/competitions/${competition.id}/hide`}
          >
            <button type="submit">Hide</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
