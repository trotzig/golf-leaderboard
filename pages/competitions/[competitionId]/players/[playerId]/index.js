import { merge } from 'lodash';
import { parse } from 'date-fns';
import { useRouter } from 'next/router';
import Link from 'next/link';
import React from 'react';

import { useJsonPData } from '../../../../../src/fetchJsonP';
import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';
import fixParValue from '../../../../../src/fixParValue';
import generateSlug from '../../../../../src/generateSlug';

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

function getPlayer(data, timesData, playerId) {
  const clazz = Object.values(data.Classes)[0];
  if (!clazz.Leaderboard.Entries) {
    if (timesData) {
      const rounds = Object.values(timesData.Rounds);
      if (rounds.length) {
        if (rounds[0].StartLists) {
          const entries = Object.values(rounds[0].StartLists)[0].Entries;
          return Object.values(entries).find(e => e.MemberID === playerId);
        }
      }
    }
    return {};
  }
  const p = Object.values(clazz.Leaderboard.Entries).find(
    e => e.MemberID === playerId,
  );
  return p;
}

function getRounds(entry) {
  if (!entry.Rounds) {
    return [];
  }
  const roundKeys = Object.keys(entry.Rounds);
  return roundKeys.map(key => entry.Rounds[key]).reverse();
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

function findPar(hole) {
  if (hole.Par) {
    return hole.Par;
  }
  return Object.values(hole.Tees)[0].Par;
}

function findLength(hole) {
  return Object.values(hole.Tees)[0].Length;
}

function Round({ round, colors, courses, now }) {
  if (!round.Number) {
    return null;
  }
  const startTime = parse(round.StartDateTime, DATE_FORMAT, now);
  const courseNameClasses = ['player-round-course'];
  const color = Object.values(colors || {}).find(
    c => c.CourseID === round.CourseRefID,
  );
  const course = courses[`C${round.CourseRefID}`];
  if (color) {
    courseNameClasses.push(color.CssName);
  }
  const holes = merge(round.Holes, course.Holes, round.HoleScores);
  return (
    <div className="player-round page-margin">
      <div className="player-round-number">
        <span>
          Round {round.Number}
          {'  '}
        </span>
        <span className={courseNameClasses.join(' ')}>{round.CourseName}</span>
      </div>
      <div className="player-round-scorecard">
        <div>
          <div className="player-round-scorecard-label">Hole</div>
          <div className="player-round-scorecard-label">Par</div>
          <div className="player-round-scorecard-label">Result</div>
        </div>
        {Object.keys(holes).map((holeKey, i) => {
          const hole = holes[holeKey];
          const toParClass =
            !hole || !hole.Result
              ? 'unknown'
              : hole.Result.ActualValue === 1
              ? 'hio'
              : hole.Result.ToParValue < -1
              ? 'eagle'
              : hole.Result.ToParValue < 0
              ? 'birdie'
              : hole.Result.ToParValue > 1
              ? 'bogey-plus'
              : hole.Result.ToParValue > 0
              ? 'bogey'
              : 'on-par';
          return (
            <div
              key={holeKey}
              title={
                hole.Index ? `Index ${hole.Index} - ${findLength(hole)}m` : null
              }
            >
              <div className="player-round-scorecard-val">
                {holeKey.replace(/^H-?/, '')}
              </div>
              <div className="player-round-scorecard-val">{findPar(hole)}</div>
              <div
                className={`player-round-scorecard-val round-score ${toParClass}`}
              >
                {hole && hole.Result
                  ? hole.Result.ActualText || hole.Result.Actual
                  : '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompetitionPlayer({ now = new Date() }) {
  const router = useRouter();
  const { competitionId, playerId } = router.query;

  const data = useJsonPData(
    competitionId &&
      `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
  );
  const timesData = useJsonPData(
    competitionId &&
      `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competitionId}/language/2057/`,
  );

  const loading = !data;
  const courseName = data && data.CompetitionData.Name;
  const player = data && getPlayer(data, timesData, playerId);
  const rounds = player && getRounds(player);
  return (
    <div>
      <Menu activeHref="/leaderboard" />
      <div className="player-profile">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2 className="player-profile-course-heading">{courseName}</h2>
            <div className="player-profile-top page-margin">
              <div>
                <b>Player</b>
                <Link href={`/${generateSlug(player)}`}>
                  <a className="player-profile-name">
                    {player.FirstName} {player.LastName}
                  </a>
                </Link>
                <span className="player-profile-club">{player.ClubName}</span>
              </div>

              {player.ResultSum && (
                <>
                  <span className="player-profile-position">
                    <b>Position</b>
                    <span>{player.Position && player.Position.Calculated}</span>
                  </span>
                  <span
                    className={`player-profile-topar${
                      player.ResultSum.ToParValue < 0 ? ' under-par' : ''
                    }`}
                  >
                    <b>Score</b>
                    <span>{fixParValue(player.ResultSum.ToParText)}</span>
                  </span>
                </>
              )}
            </div>
            <div className="player-profile-rounds">
              {rounds.map(round => {
                return (
                  <Round
                    courses={data.Courses}
                    key={round.StartDateTime}
                    colors={data.CourseColours}
                    round={round}
                    now={now}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
