import { format, startOfDay } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import FlagIcon from './FlagIcon';
import PlayerPhoto from './PlayerPhoto';
import { useJsonPData } from './fetchJsonP';
import ClockIcon from './ClockIcon';
import FavoriteButton from './FavoriteButton';
import Lazy from './Lazy';
import LoadingSkeleton from './LoadingSkeleton';
import PlayerDialog from './PlayerDialog';
import competitionDateString from './competitionDateString';
import formatCompetitionName from './formatCompetitionName';
import getCompetitionTour from './getCompetitionTour.mjs';
import normalizeName from './normalizeName.js';
import ensureDates from './ensureDates.js';
import CutInfo from './CutInfo';
import { detectFormat, isGoodScore, formatLabel } from './competitionFormat.mjs';
import fixParValue from './fixParValue';
import generateSlug from './generateSlug.mjs';
import parseCET from './parseCET';
import removeCommonCoursePrefix from './removeCommonCoursePrefix.js';
import YouTubeEmbed from './YouTubeEmbed';
import VenueMapLink from './VenueMapLink';

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
  if (!playersData.Classes || !Object.keys(playersData.Classes).length) {
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

function RoundTotal({ score, format, holes }) {
  const classes = ['round-score', 'round-total'];
  const stableford = format === 'stableford';
  const value = stableford ? Number(score?.Result?.Actual) : score?.Score;
  if (score) {
    if (stableford) {
      if (Number.isFinite(value) && value > 2 * holes) {
        classes.push('under-par');
      }
    } else if (score.Score < score.Par) {
      classes.push('under-par');
    }
  }
  return (
    <span className={classes.join(' ')}>
      {Number.isFinite(value) && value > 0 ? value : null}
    </span>
  );
}

function Round({ round, colors, now, format }) {
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
          const hasScore = score && score.Score.Value > 0;
          const stableford = format === 'stableford';
          const toParClass = !score
            ? 'unknown'
            : !hasScore
            ? 'picked-up'
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
          let cellContent = '-';
          if (score) {
            cellContent = stableford
              ? typeof score.Result?.ActualValue === 'number'
                ? score.Result.ActualValue
                : '-'
              : hasScore
              ? score.Score.Value
              : '-';
          }
          const result = [
            <span key={holeKey} className={`round-score ${toParClass}`}>
              {cellContent}
            </span>,
          ];
          if (i === 8) {
            result.push(
              <RoundTotal
                score={round.HoleScores['H-OUT']}
                format={format}
                holes={9}
                key="out"
              />,
            );
          }
          if (i === 17) {
            result.push(
              <RoundTotal
                score={round.HoleScores['H-IN']}
                format={format}
                holes={9}
                key="in"
              />,
            );
            result.push(
              <RoundTotal
                score={round.HoleScores['H-TOTAL']}
                format={format}
                holes={18}
                key="total"
              />,
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
  isFavorite,
  onFavoriteChange,
  lastFavoriteChanged,
  colors,
  now,
  lazy,
  competition,
  onScorecardClick,
  collidingSlugs,
  format,
}) {
  const rounds = getRounds(entry);
  const classes = ['player'];
  if (isFavorite) {
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
        <Link href={`/${generateSlug(entry, collidingSlugs)}`} className="player-big-position">
          <PlayerPhoto player={entry} />
          <div>
            <h2 className="player-big-name">
              {normalizeName(entry.FirstName)} {normalizeName(entry.LastName)}
            </h2>
            <div className="player-big-club">
              <FlagIcon nationality={entry.Nationality} />
              {entry.ClubName || entry.Country}
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
      {(() => {
        const inner = (
          <>
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
                {entry.Position && entry.Position.Calculated ? (
                  <span className="position-inline">{entry.Position.Calculated}</span>
                ) : null}
                {normalizeName(entry.FirstName)} {normalizeName(entry.LastName)}
                <br />
                <span className="club">
                  <FlagIcon nationality={entry.Nationality} />
                  {entry.ClubName || entry.Country}
                  {process.env.NEXT_PUBLIC_SHOW_PHCP
                    ? ` — HCP ${entry.PHCP}`
                    : null}
                </span>
              </span>
            ) : null}
            {entry.ResultSum && !big ? (
              <span
                className={`score${
                  isGoodScore(format, entry.ResultSum.ToParValue) ? ' under-par' : ''
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
                    format={format}
                  />
                );
              })}
            </StatsWrapper>
          </>
        );
        return rounds.length > 0 && rounds[0].Holes && onScorecardClick ? (
          <button
            type="button"
            className="player-link"
            onClick={() => onScorecardClick(entry)}
          >
            {inner}
          </button>
        ) : (
          <Link href={`/${generateSlug(entry, collidingSlugs)}`} className="player-link">
            {inner}
          </Link>
        );
      })()}
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

/**
 * Match play knockout brackets aren't exposed through the stroke-play
 * leaderboard (which returns no entries). The bracket, pairings and match
 * results live in a dedicated MatchplayHandler feed, grouped by round then by
 * match. Each match has two `Entries`; the winner of a completed match is
 * flagged with `IsLead`, and the outcome is in the match's `Result` string
 * (e.g. "3&2", "1 Hole", or "19th" for a sudden-death win on the 19th hole).
 */
function getMatchPlayRounds(matchPlayData) {
  if (!matchPlayData || !matchPlayData.Matchplay) {
    return [];
  }
  const classes = Object.values(matchPlayData.Matchplay);
  if (!classes.length) {
    return [];
  }
  const clazz = classes[0];
  // Names for the "real" rounds (Round 1, Quarter Final, ...) come from the
  // competition setup. GolfBox includes trailing placement/consolation rounds
  // beyond NumberOfRounds that it doesn't surface, so we cap on it too.
  const roundNames = {};
  for (const round of matchPlayData.CompetitionData?.RoundSetup || []) {
    roundNames[round.Number] = round.Name;
  }
  const maxRounds = clazz.NumberOfRounds || Infinity;

  const rounds = [];
  for (const roundKey of Object.keys(clazz.Rounds || {})) {
    const round = clazz.Rounds[roundKey];
    if (round.Number > maxRounds) {
      continue;
    }
    const matches = Object.values(round.Matches || {}).sort(
      (a, b) => (a.OrderNo || a.MatchNo) - (b.OrderNo || b.MatchNo),
    );
    if (!matches.length) {
      continue;
    }
    rounds.push({
      key: roundKey,
      number: round.Number,
      name: roundNames[round.Number] || `Round ${round.Number}`,
      matches,
    });
  }
  // Show the furthest-progressed round first so the current action is on top.
  rounds.reverse();
  return rounds;
}

function isPlayerEntry(entry) {
  return Boolean(entry && entry.EntryId && (entry.FirstName || entry.LastName));
}

// "6&5" -> "6 & 5"; other GolfBox result strings ("1 Hole", "19th") pass through.
function formatMatchResult(result) {
  const holes = result && result.match(/^(\d+)&(\d+)$/);
  return holes ? `${holes[1]} & ${holes[2]}` : result;
}

// "2UP" -> "2 up"; "A/S" (all square) and anything else pass through.
function formatMatchStatus(text) {
  if (!text) {
    return 'A/S';
  }
  const up = text.match(/^(\d+)UP$/i);
  return up ? `${up[1]} up` : text;
}

/**
 * Derive what to show in the centre column for a match, and its overall state,
 * from the GolfBox fields (`HoleText` is "F" when final, a start time before
 * the match begins, "-" when the pairing isn't decided yet, otherwise the hole
 * the match stands through).
 */
function getMatchDisplay(match) {
  const entries = match.Entries || [];
  if (match.IsBye) {
    return { state: 'bye' };
  }
  if (!isPlayerEntry(entries[0]) || !isPlayerEntry(entries[1])) {
    return { state: 'tbd' };
  }
  if (match.HoleText === 'F') {
    return { state: 'completed', result: formatMatchResult(match.Result) };
  }
  if (!match.HoleText || match.HoleText === '-' || match.HoleText.includes(':')) {
    return { state: 'notstarted', startTime: formatCETTime(match.StartTime) };
  }
  const leader = entries.find(e => e.IsLead);
  return {
    state: 'inprogress',
    status: formatMatchStatus(leader && leader.MatchResult?.ActualText),
    thru: match.HoleText,
  };
}

function LeadArrow({ direction }) {
  return (
    <svg
      className="match-lead-arrow"
      viewBox="0 0 10 10"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <polygon points={direction === 'left' ? '7,1 1,5 7,9' : '3,1 9,5 3,9'} />
    </svg>
  );
}

function MatchCenter({ display, leadSide }) {
  let value;
  switch (display.state) {
    case 'completed':
      value = <span className="match-result">{display.result}</span>;
      break;
    case 'inprogress':
      value = (
        <span className="match-inprogress">
          <span className="match-status">{display.status}</span>
          <span className="match-thru">thru {display.thru}</span>
        </span>
      );
      break;
    case 'notstarted':
      value = <span className="round-start-time">{display.startTime}</span>;
      break;
    case 'bye':
      value = <span className="match-bye">Bye</span>;
      break;
    default:
      value = <span className="match-center-tbd">–</span>;
  }
  return (
    <div className="match-center">
      {leadSide === 'left' && <LeadArrow direction="left" />}
      {value}
      {leadSide === 'right' && <LeadArrow direction="right" />}
    </div>
  );
}

function MatchPlayer({
  player,
  align,
  isWinner,
  isLoser,
  isFavorite,
  onFavoriteChange,
  lastFavoriteChanged,
  collidingSlugs,
}) {
  if (!isPlayerEntry(player)) {
    return (
      <span className={`match-player match-player--${align} match-player--tbd`}>
        To be decided
      </span>
    );
  }
  const classes = ['match-player', `match-player--${align}`];
  if (isWinner) {
    classes.push('match-player--winner');
  }
  if (isLoser) {
    classes.push('match-player--loser');
  }
  if (isFavorite) {
    classes.push('favorite-player');
  }
  return (
    <span className={classes.join(' ')}>
      <FavoriteButton
        playerId={player.MemberID}
        onChange={onFavoriteChange}
        icon
        lastFavoriteChanged={lastFavoriteChanged}
      />
      <Link
        href={`/${generateSlug(player, collidingSlugs)}`}
        className="match-player-link"
      >
        <span className="match-player-name">
          {normalizeName(player.FirstName)} {normalizeName(player.LastName)}
        </span>
        <span className="club">
          <FlagIcon nationality={player.Nationality} />
          {player.ClubName || player.Country}
        </span>
      </Link>
    </span>
  );
}

function Match({
  match,
  favoriteIds,
  onFavoriteChange,
  lastFavoriteChanged,
  collidingSlugs,
}) {
  const display = getMatchDisplay(match);
  const [first, second] = match.Entries || [];
  // Emphasise the leader for both finished and in-progress matches; when a match
  // is all square there is no leader, so neither side is highlighted.
  const showLead =
    display.state === 'completed' || display.state === 'inprogress';
  const hasLeader = (match.Entries || []).some(e => e && e.IsLead);
  const leadSide = showLead
    ? first?.IsLead
      ? 'left'
      : second?.IsLead
      ? 'right'
      : null
    : null;
  return (
    <li className="match">
      <MatchPlayer
        player={first}
        align="left"
        isWinner={showLead && Boolean(first?.IsLead)}
        isLoser={showLead && hasLeader && !first?.IsLead}
        isFavorite={favoriteIds.has(first?.MemberID)}
        onFavoriteChange={onFavoriteChange}
        lastFavoriteChanged={lastFavoriteChanged}
        collidingSlugs={collidingSlugs}
      />
      <MatchCenter display={display} leadSide={leadSide} />
      <MatchPlayer
        player={second}
        align="right"
        isWinner={showLead && Boolean(second?.IsLead)}
        isLoser={showLead && hasLeader && !second?.IsLead}
        isFavorite={favoriteIds.has(second?.MemberID)}
        onFavoriteChange={onFavoriteChange}
        lastFavoriteChanged={lastFavoriteChanged}
        collidingSlugs={collidingSlugs}
      />
    </li>
  );
}

function MatchPlay({
  rounds,
  favoriteIds,
  onFavoriteChange,
  lastFavoriteChanged,
  collidingSlugs,
}) {
  return (
    <div className="matchplay">
      {rounds.map(round => (
        <div className="matchplay-round" key={round.key}>
          <h3 className="leaderboard-section-heading">{round.name}</h3>
          <ul>
            {round.matches.map(match => (
              <Match
                key={match.MatchID || match.MatchNo}
                match={match}
                favoriteIds={favoriteIds}
                onFavoriteChange={onFavoriteChange}
                lastFavoriteChanged={lastFavoriteChanged}
                collidingSlugs={collidingSlugs}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function isCompetitionFinished(competitionData, data, timesData) {
  if (!competitionData || competitionData.DefaultAction !== 'finalresults') {
    return false;
  }
  if (data && timesData) {
    const classKey = Object.keys(data.Classes || {})[0];
    const leaderboardRound =
      classKey && data.Classes[classKey].Leaderboard.ActiveRoundNumber;
    const totalRounds =
      timesData.Rounds && Object.keys(timesData.Rounds).length;
    if (leaderboardRound && totalRounds && leaderboardRound < totalRounds) {
      return false;
    }
  }
  return true;
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
  initialMatchPlayData,
  loadingOverride,
  account,
  competition = {},
  now: nowMs = Date.now(),
  lazyItems = true,
  baseUrl,
  collidingSlugs: collidingSlugsArray = [],
}) {
  const collidingSlugs = useMemo(() => new Map(collidingSlugsArray), [collidingSlugsArray]);
  ensureDates(competition);
  const now = new Date(nowMs);
  const { query } = useRouter();
  const handledQueryPlayer = useRef(false);
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const [selectedEntry, setSelectedEntry] = useState(null);
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
  // Match play brackets/results come from a dedicated feed. Only fetch it once
  // the leaderboard confirms the format, since it's a much larger payload.
  const isMatchPlayCompetition = data?.CompetitionData?.Type === 'MatchPlay';
  const matchPlayData = useJsonPData(
    isMatchPlayCompetition
      ? `https://scores.golfbox.dk/Handlers/MatchplayHandler/GetMatchplay/CompetitionId/${competition.id}/language/2057/`
      : null,
    initialMatchPlayData,
  );
  const loading =
    loadingOverride ||
    !data ||
    !timesData ||
    !playersData ||
    (isMatchPlayCompetition && !matchPlayData);

  const handleFavoriteChange = useCallback(() => {
    setLastFavoriteChanged(new Date());
  }, []);


  const finishedResult = getFinishedResult(data);
  const entries = useMemo(
    () =>
      data && timesData && playersData
        ? getEntries(data, timesData, playersData)
        : [],
    [data, timesData, playersData],
  );
  const format = useMemo(
    () => detectFormat({ competitionData, entries }),
    [competitionData, entries],
  );
  const matchRounds = useMemo(
    () => getMatchPlayRounds(matchPlayData),
    [matchPlayData],
  );

  useEffect(() => {
    if (handledQueryPlayer.current || !query.player || !entries || !entries.length) return;
    const entry = entries.find(e => generateSlug(e, collidingSlugs) === query.player);
    if (entry) {
      handledQueryPlayer.current = true;
      setSelectedEntry(entry);
    }
  }, [query.player, entries]);

  const isMatchPlay = isMatchPlayCompetition || matchRounds.length > 0;
  const finished = isCompetitionFinished(competitionData, data, timesData);
  const winner = finished ? getWinner(entries) : undefined;

  const favoriteIds = useMemo(() => {
    const ids = new Set();
    const memberIds = entries.map(entry => entry.MemberID);
    for (const round of matchRounds) {
      for (const match of round.matches) {
        for (const entry of match.Entries || []) {
          memberIds.push(entry.MemberID);
        }
      }
    }
    for (const memberId of memberIds) {
      if (memberId && localStorage.getItem(String(memberId))) {
        ids.add(memberId);
      }
    }
    return ids;
  }, [entries, matchRounds, lastFavoriteChanged]);

  const favorites = entries && entries.filter(e => favoriteIds.has(e.MemberID));
  return (
    <div className="leaderboard-page">
      <Head>
        <title>{`${formatCompetitionName(competition.name)} | ${getHeading(competition, now, finished)}`}</title>
        {baseUrl && <link rel="canonical" href={`${baseUrl}/t/${competition.slug}`} />}
        <meta
          name="description"
          content={`Follow the leaderboard and see tee times for ${formatCompetitionName(competition.name)}${competition.venue ? ` at ${competition.venue}` : ''}.`}
        />
        <meta
          property="og:title"
          content={`${formatCompetitionName(competition.name)} | ${getHeading(competition, now, finished)}`}
        />
        <meta
          property="og:description"
          content={`Follow the leaderboard and see tee times for ${formatCompetitionName(competition.name)}${competition.venue ? ` at ${competition.venue}` : ''}.`}
        />
        <meta property="og:type" content="website" />
        {finishedResult?.youtubeId && (
          <>
            <meta
              property="og:image"
              content={`https://img.youtube.com/vi/${finishedResult.youtubeId}/maxresdefault.jpg`}
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:image"
              content={`https://img.youtube.com/vi/${finishedResult.youtubeId}/maxresdefault.jpg`}
            />
          </>
        )}
        <meta
          name="twitter:title"
          content={`${formatCompetitionName(competition.name)} | ${getHeading(competition, now, finished)}`}
        />
        <meta
          name="twitter:description"
          content={`Follow the leaderboard and see tee times for ${formatCompetitionName(competition.name)}${competition.venue ? ` at ${competition.venue}` : ''}.`}
        />
      </Head>
      <div className="h-intro">{getHeading(competition, now, finished)}</div>
      <h2 className="leaderboard-page-heading">{formatCompetitionName(competition.name)}</h2>
      {getCompetitionTour(competition.categories) && (
        <p className="leaderboard-page-tour">{getCompetitionTour(competition.categories)}</p>
      )}
      {competition.venue && (
        <p className="leaderboard-page-subtitle">
          <VenueMapLink venue={competition.venue} />
          {competition.start && (() => {
            const { date, suffix } = competitionDateString(competition, now, { finished, parts: true });
            return (
              <>
                <span>•</span>
                <span>{date}</span>
                {suffix && (
                  <>
                    <span>•</span>
                    <span>{suffix}</span>
                  </>
                )}
              </>
            );
          })()}
        </p>
      )}
      {/* Match play shows tee times inline in the bracket, so it has no
          separate tee-times view. */}
      {!isMatchPlay && (
        <div className="page-tabs">
          <span className="page-tab page-tab--active">Leaderboard</span>
          <Link className="page-tab" href={`/t/${competition.slug}/tee-times`}>
            Tee times
          </Link>
        </div>
      )}
      {formatLabel(format) && (
        <div className="alert page-margin format-notice">
          <strong>{formatLabel(format)} format.</strong>{' '}
          Scoring differs from stroke play: higher points are better, and{' '}
          a positive total (e.g. <code>+4p</code>) means above the points par.
        </div>
      )}
      <CutInfo data={data} entries={entries} />
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
      {!loading && !isMatchPlay && (!timesData || !timesData.ActiveRoundNumber) && (
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
              isFavorite={favoriteIds.has(winner.MemberID)}
              onFavoriteChange={handleFavoriteChange}
              lastFavoriteChanged={lastFavoriteChanged}
              onScorecardClick={setSelectedEntry}
              collidingSlugs={collidingSlugs}
              format={format}
            />
          </ul>
        </div>
      )}
      {isMatchPlay ? (
        <MatchPlay
          rounds={matchRounds}
          favoriteIds={favoriteIds}
          onFavoriteChange={handleFavoriteChange}
          lastFavoriteChanged={lastFavoriteChanged}
          collidingSlugs={collidingSlugs}
        />
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
                      entry={{ ...entry, isFirstCut: false, isFirstCutPerformed: false }}
                      isFavorite={true}
                      onFavoriteChange={handleFavoriteChange}
                      lastFavoriteChanged={lastFavoriteChanged}
                      onScorecardClick={setSelectedEntry}
                      collidingSlugs={collidingSlugs}
                      format={format}
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
                  isFavorite={favoriteIds.has(entry.MemberID)}
                  onFavoriteChange={handleFavoriteChange}
                  lazy={lazyItems && i > 20}
                  lastFavoriteChanged={lastFavoriteChanged}
                  onScorecardClick={setSelectedEntry}
                  collidingSlugs={collidingSlugs}
                  format={format}
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
      <PlayerDialog
        entry={selectedEntry}
        competition={competition}
        data={data}
        onClose={() => setSelectedEntry(null)}
        collidingSlugs={collidingSlugs}
        lastFavoriteChanged={lastFavoriteChanged}
        onFavoriteChange={() => setLastFavoriteChanged(Date.now())}
        format={format}
      />
    </div>
  );
}
