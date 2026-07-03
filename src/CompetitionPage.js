import { parse, format, startOfDay } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

import { useJsonPData } from './fetchJsonP';
import ClockIcon from './ClockIcon';
import Lazy from './Lazy';
import LoadingSkeleton from './LoadingSkeleton';
import competitionDateString from './competitionDateString';
import ensureDates from './ensureDates.js';
import fixParValue from './fixParValue';
import generateSlug from './generateSlug.mjs';
import { KFF_CURRENT_SLUG, KFF_EDITIONS } from './kffConfig.mjs';
import removeCommonCoursePrefix from './removeCommonCoursePrefix.js';
import YouTubeEmbed from './YouTubeEmbed';

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

// Builds the start-list groupings shown before a competition starts. Entries in
// the active round are grouped by MatchNo (the group/flight number); within each
// group players are grouped into their teams.
function getStartGroups(timesData) {
  if (!timesData || !timesData.ActiveRoundNumber || !timesData.Rounds) {
    return null;
  }
  const round = timesData.Rounds[`R${timesData.ActiveRoundNumber}`];
  if (!round || !round.StartLists) {
    return null;
  }
  const byMatch = new Map();
  for (const startList of Object.values(round.StartLists)) {
    for (const entry of startList.Entries || []) {
      if (!byMatch.has(entry.MatchNo)) {
        byMatch.set(entry.MatchNo, {
          matchNo: entry.MatchNo,
          startTime: entry.StartTime,
          hole: entry.Hole,
          teams: new Map(),
        });
      }
      const group = byMatch.get(entry.MatchNo);
      const teamId = entry.TeamID || entry.MemberID;
      if (!group.teams.has(teamId)) {
        group.teams.set(teamId, { teamId, players: [] });
      }
      group.teams.get(teamId).players.push({
        memberId: entry.MemberID,
        name: `${(entry.FirstName || '').trim()} ${(
          entry.LastName || ''
        ).trim()}`.trim(),
        club: entry.ClubName,
        orderNo: entry.OrderNo,
      });
    }
  }
  const groups = [...byMatch.values()].map(group => ({
    matchNo: group.matchNo,
    startTime: group.startTime,
    hole: group.hole,
    teams: [...group.teams.values()]
      .map(team => ({
        teamId: team.teamId,
        players: team.players.slice().sort((a, b) => a.orderNo - b.orderNo),
      }))
      .sort((a, b) => a.players[0].orderNo - b.players[0].orderNo),
  }));
  groups.sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
    if (a.hole !== b.hole) return a.hole - b.hole;
    return a.matchNo - b.matchNo;
  });
  return groups.length ? groups : null;
}

function getEntriesFromPlayersData(playersData) {
  if (!playersData.Classes) {
    return [];
  }
  return Object.values(Object.values(playersData.Classes)[0].Entries).filter(
    p => {
      return p.PlayerStatus === 1;
    },
  );
}

function getLeaderboard(data) {
  const classKey = data && Object.keys(data.Classes || {})[0];
  return classKey ? data.Classes[classKey].Leaderboard : null;
}

// True when the leaderboard actually carries results (teams or entries). Used to
// tell a real, populated leaderboard apart from an empty/flaky GolfBox response.
function hasLeaderboardResults(data) {
  const leaderboard = getLeaderboard(data);
  if (!leaderboard) {
    return false;
  }
  const results = leaderboard.Entries || leaderboard.Teams;
  return !!results && Object.keys(results).length > 0;
}

function getEntries(data, timesData, playersData) {
  const leaderboard = getLeaderboard(data);
  let entries = leaderboard
    ? leaderboard.Entries || leaderboard.Teams
    : undefined;
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
  const classKey = Object.keys(data.Classes || {})[0];
  const cut = classKey && data.Classes[classKey] && data.Classes[classKey].Cut;
  const cutPosition = cut && cut.Position;
  for (const entry of result) {
    if (
      cutPosition &&
      entry.Position &&
      entry.Position.Actual - 1 === cutPosition
    ) {
      entry.isFirstCut = true;
      entry.isFirstCutPerformed = cut.IsPerformed;
    }
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
  if (score && score.Score < score.Par) {
    classes.push('under-par');
  }
  return (
    <span className={classes.join(' ')}>
      {score && score.Score > 0 ? score.Score : null}
    </span>
  );
}

function Round({ round, colors, now, hole }) {
  const startTime = parse(round.StartDateTime, DATE_FORMAT, now);

  const classes = ['round'];
  const courseColors = Object.values(colors || {});
  const color = courseColors.find(c => c.CourseID === round.CourseRefID);
  if (color && courseColors.length > 1) {
    classes.push(color.CssName);
  }
  const allHoles = {
    H1: null,
    H2: null,
    H3: null,
    H4: null,
    H5: null,
    H6: null,
    H7: null,
    H8: null,
    H9: null,
    H10: null,
    H11: null,
    H12: null,
    H13: null,
    H14: null,
    H15: null,
    H16: null,
    H17: null,
    H18: null,
    'H-IN': null,
    'H-OUT': null,
    'H-TOTAL': null,
  };
  return (
    <div className={classes.join(' ')}>
      {now < startTime || !round.HoleScores ? (
        <div className="round-start-time">
          {format(startTime, 'HH:mm')}
          <span className="round-hole">{hole ? ` | Hole ${hole}` : null}</span>
        </div>
      ) : (
        Object.keys(round.Holes || allHoles).map((holeKey, i) => {
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

function getFirstRoundStart(round, now) {
  const startTime = parse(round.StartDateTime, DATE_FORMAT, now);
  return startTime;
}

function getTeamName(entry) {
  return Object.values(entry.Entries || {})
    .map(e => `${e.FirstName} ${e.LastName}`)
    .join(' / ');
}
function getTeamClub(entry) {
  return [...new Set(Object.values(entry.Entries || {}).map(e => e.ClubName))]
    .filter(Boolean)
    .join(' / ');
}

function Player({
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
      <div className="player-grid">
        <span className={positionClassname}>
          <span>
            {entry.Position && entry.Position.Calculated ? (
              entry.Position.Calculated
            ) : rounds && rounds.length > 0 ? (
              <ClockIcon
                date={getFirstRoundStart(rounds[rounds.length - 1], now)}
              />
            ) : null}
          </span>
        </span>
        <span>
          {entry.FirstName ? (
            <span>
              {entry.FirstName} {entry.LastName}
            </span>
          ) : (
            <span>{getTeamName(entry)}</span>
          )}
          <br />
          <span className="club">
            {entry.Team ? `${entry.Team} — ` : ''}{' '}
            {entry.ClubName || getTeamClub(entry)}
            {process.env.NEXT_PUBLIC_SHOW_PHCP ? ` — HCP ${entry.PHCP}` : null}
          </span>
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
        <span>
          <StatsWrapper className="stats" minHeight={statsHeight}>
            {rounds.map(round => {
              return (
                <Round
                  key={round.StartDateTime}
                  round={round}
                  hole={entry.Hole}
                  colors={colors}
                  now={now}
                />
              );
            })}
          </StatsWrapper>
        </span>
      </div>
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

function CutInfo({ data }) {
  if (!data) {
    return null;
  }
  const clazz = Object.values(data.Classes || {})[0];
  if (!clazz) {
    return null;
  }
  const cut = clazz.Cut;
  if (!cut) {
    return null;
  }

  if (!cut.AfterRound) {
    return null;
  }
  if (
    clazz.Leaderboard &&
    clazz.Leaderboard.ActiveRoundNumber < cut.AfterRound
  ) {
    return null;
  }

  return (
    <span>
      {cut.Position} players{' '}
      {cut.IsPerformed ? 'made' : 'are projected to make'}{' '}
      <a href="#cut">the cut</a>.
    </span>
  );
}

function StartList({ groups, now }) {
  return (
    <div className="start-list">
      <h3 className="leaderboard-section-heading">Start list</h3>
      {groups.map(group => (
        <div className="start-group" key={group.matchNo}>
          <div className="start-group-header">
            {format(parse(group.startTime, DATE_FORMAT, now), 'HH:mm')} - Hole{' '}
            {group.hole}
          </div>
          {group.teams.map(team => {
            const clubs = [
              ...new Set(team.players.map(p => p.club).filter(Boolean)),
            ].join(' / ');
            return (
              <div className="start-group-team" key={team.teamId}>
                <div className="start-group-players">
                  {team.players.map(p => p.name).join(' / ')}
                </div>
                {clubs && <div className="start-group-club">{clubs}</div>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MatchPlay({ entries, now }) {
  return (
    <div>
      <h3 className="leaderboard-section-heading">Matches</h3>
      <ul>
        {entries.map(entry => {
          const startTime = parse(entry.StartTime, DATE_FORMAT, now);
          return (
            <li className="match" key={entry.MatchNo}>
              <span>
                {entry.Players[0].FirstName} {entry.Players[0].LastName}
                <br />
                <span className="club">{entry.Players[0].ClubName}</span>
              </span>

              <div className="round-start-time">
                {format(startTime, 'HH:mm')}
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
  loadingOverride,
  account,
  competition = {},
  now = new Date(),
  lazyItems = true,
}) {
  ensureDates(competition);
  const selectedEdition = KFF_EDITIONS.find(e => e.slug === competition.slug);
  const isPreviousEdition =
    selectedEdition && selectedEdition.slug !== KFF_CURRENT_SLUG;
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  // A finished competition must have a populated leaderboard; if GolfBox returns
  // an empty one, treat it as a flaky response rather than falling back to the
  // individual players list.
  const competitionFinished = competition.end && competition.end < now;
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
    initialData,
    competitionFinished ? hasLeaderboardResults : undefined,
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

  const finishedResult = getFinishedResult(data);
  const entries =
    data && timesData && playersData
      ? getEntries(data, timesData, playersData)
      : [];

  const isMatchPlay = entries && entries[0] && entries[0].Players;

  for (const entry of entries || []) {
    entry.isFavorite = localStorage.getItem(entry.MemberID);
  }

  const favorites = entries && entries.filter(e => e.isFavorite);

  // Before the competition starts, show the groupings/start list instead of an
  // empty leaderboard.
  const isUpcoming = competition.start && competition.start > startOfDay(now);
  const startGroups = isUpcoming ? getStartGroups(timesData) : null;

  return (
    <div className="leaderboard-page">
      <Head>
        <title>
          {competition.name} | {getHeading(competition, now)}
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
      <nav className="kff-previous-years">
        {KFF_EDITIONS.map(({ year, slug }) => (
          <Link key={year} href={slug === KFF_CURRENT_SLUG ? '/' : `/t/${slug}`}>
            <a className={slug === competition.slug ? 'selected' : undefined}>
              {year}
            </a>
          </Link>
        ))}
      </nav>
      <div className="leaderboard-page-header">
        <div className="leaderboard-page-header-left">
          <img
            style={{ width: 200, height: 'auto' }}
            width="600"
            height="602"
            src="/kff-logo.png"
            alt="KFF logo"
          />
        </div>
        <div className="leaderboard-page-header-right">
          <div className="h-intro">
            {getHeading(competition, now)}
            {isPreviousEdition && (
              <span className="year-badge">{selectedEdition.year}</span>
            )}
          </div>
          <h2 className="leaderboard-page-heading">{competition.name}</h2>
          {competition.venue && (
            <p className="leaderboard-page-subtitle">
              {competition.venue} –{' '}
              {competition.start && competitionDateString(competition, now)}.{' '}
              <CutInfo data={data} />
            </p>
          )}
        </div>
      </div>
      {data && (
        <>
          {Object.values(data.Courses || {}).length > 1 ? (
            <div className="courses">
              {Object.values(data.CourseColours || {}).map(course => {
                return (
                  <div key={course.CourseID}>
                    <Link
                      href={`/t/${competition.slug}/courses/${course.CourseID}`}
                    >
                      <a className={course.CssName}>
                        {removeCommonCoursePrefix(
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
      {startGroups ? (
        <StartList groups={startGroups} now={now} />
      ) : entries && isMatchPlay ? (
        <MatchPlay entries={entries} now={now} />
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
                      key={entry.MemberID || getTeamName(entry)}
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
                  key={entry.MemberID || getTeamName(entry)}
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
