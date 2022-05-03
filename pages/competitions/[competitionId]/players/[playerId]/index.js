import { merge } from 'lodash';
import { parse } from 'date-fns';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import React from 'react';

import { useJsonPData } from '../../../../../src/fetchJsonP';
import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';
import fixParValue from '../../../../../src/fixParValue';
import prisma from '../../../../../src/prisma';
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

export default function CompetitionPlayer({
  now = new Date(),
  player,
  competition,
}) {
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
  );
  const timesData = useJsonPData(
    `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competition.id}/language/2057/`,
  );

  const loading = !data;
  const courseName = data && data.CompetitionData.Name;
  const roundPlayer = data && getPlayer(data, timesData, player.id);
  const rounds = roundPlayer && getRounds(roundPlayer);
  return (
    <div>
      <Head>
        <title>
          {player.firstName} {player.lastName}'s scorecard in {competition.name}
        </title>
        <meta
          name="description"
          content={`Results for ${player.firstName} ${player.lastName} in ${competition.name}`}
        />
      </Head>
      <Menu activeHref="/leaderboard" />
      <div className="player-profile">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2 className="player-profile-course-heading">
              {competition.name}
            </h2>
            <div className="player-profile-top page-margin">
              <div>
                <b>Player</b>
                <Link href={`/${player.slug}`}>
                  <a className="player-profile-name">
                    {player.firstName} {player.lastName}
                  </a>
                </Link>
                <span className="player-profile-club">{player.clubName}</span>
              </div>

              {roundPlayer.ResultSum && (
                <>
                  <span className="player-profile-position">
                    <b>Position</b>
                    <span>
                      {roundPlayer.Position && roundPlayer.Position.Calculated}
                    </span>
                  </span>
                  <span
                    className={`player-profile-topar${
                      roundPlayer.ResultSum.ToParValue < 0 ? ' under-par' : ''
                    }`}
                  >
                    <b>Score</b>
                    <span>{fixParValue(roundPlayer.ResultSum.ToParText)}</span>
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

export async function getServerSideProps({ params }) {
  const [competition, player] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: parseInt(params.competitionId, 10) },
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
      },
    }),
    prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        clubName: true,
      },
    }),
  ]);
  if (!competition) {
    return { notFound: true };
  }
  if (!player) {
    return { notFound: true };
  }
  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  return {
    props: { competition, player },
  };
}
