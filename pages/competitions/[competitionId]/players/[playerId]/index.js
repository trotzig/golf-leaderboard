import { format, parse } from 'date-fns';
import { useRouter } from 'next/router';
import React from 'react';

import { useJsonPData } from '../../../../../src/fetchJsonP';
import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';
import fixParValue from '../../../../../src/fixParValue';

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

function getPlayer(data, playerId) {
  const clazz = Object.values(data.Classes)[0];
  const p = Object.values(clazz.Leaderboard.Entries).find(
    e => e.MemberID === playerId,
  );
  return p;
}

function getRounds(entry) {
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
  console.log(round);
  const courseNameClasses = ['player-round-course'];
  const color = Object.values(colors || {}).find(
    c => c.CourseID === round.CourseRefID,
  );
  if (color) {
    courseNameClasses.push(color.CssName);
  }
  return (
    <div className="player-round page-margin">
      <div className="player-round-number">Round {round.Number}</div>
      <div className={courseNameClasses.join(' ')}>{round.CourseName}</div>
      <div className="player-round-scorecard">
        <span>Hole</span>
        <span>Par</span>
        <span>Result</span>
        {Object.keys(round.HoleScores || {}).map((holeKey, i) => {
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
          return (
            <>
              <span>{holeKey.replace(/^H-?/, '')}</span>
              <span>{score.Par}</span>
              <span className={`round-score ${toParClass}`}>
                {score ? score.Result.ActualText || score.Result.Actual : '-'}
              </span>
            </>
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

  const loading = !data;
  const courseName = data && data.CompetitionData.Name;
  const player = data && getPlayer(data, playerId);
  const rounds = player && getRounds(player);
  console.log(rounds);
  return (
    <div>
      <Menu />
      <div className="player-profile">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="player-profile-top page-margin">
              <div>
                <b>Player</b>
                <div className="player-profile-name">
                  {player.FirstName} {player.LastName}
                </div>
                <span className="player-profile-club">{player.ClubName}</span>
              </div>

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
            </div>
            <h3>{courseName}</h3>
            <div className="player-profile-rounds">
              {rounds.map(round => {
                return (
                  <Round
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
