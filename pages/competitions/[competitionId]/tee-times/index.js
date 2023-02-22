import { parse, format } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { useJsonPData } from '../../../../src/fetchJsonP.js';
import Menu from '../../../../src/Menu.js';
import competitionDateString from '../../../../src/competitionDateString.js';
import ensureDates from '../../../../src/ensureDates.js';
import prisma from '../../../../src/prisma';
import removeCommonCoursePrefix from '../../../../src/removeCommonCoursePrefix.js';

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

function getGames(entries, now, courses) {
  const result = [];

  let currentGame;

  for (const entry of entries) {
    if (!currentGame || currentGame.number !== entry.MatchNo) {
      const time = parse(entry.StartTime, DATE_FORMAT, now);
      currentGame = {
        course: removeCommonCoursePrefix(courses, entry.CourseName),
        time,
        startingHole: entry.Hole,
        players: [],
        number: entry.MatchNo,
      };
      result.push(currentGame);
    }
    currentGame.players.push({
      memberId: entry.MemberID,
      lastName: entry.LastName,
      firstName: entry.FirstName,
      clubName: entry.ClubName,
    });
  }
  return result;
}

export default function TeeTimesPage({ competition, now = new Date(), round }) {
  ensureDates(competition);
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competition.id}/language/2057/`,
  );
  console.log(data);
  const loading = !data;
  const usedRound = round || (data && data.ActiveRoundNumber);
  console.log({ usedRound });
  return (
    <div className="tee-times-page">
      <Head>
        <title>{competition.name} | Tee times</title>
        <meta
          name="description"
          content={`See tee times for ${competition.name}`}
        />
      </Head>
      <Menu activeHref="/tee-times" />
      <div className="h-intro">Tee times</div>
      <h2 className="tee-times-page-heading">{competition.name}</h2>
      {competition.venue && (
        <p className="tee-times-page-subtitle">
          {competition.venue} –{' '}
          {competition.start && competitionDateString(competition, now)}.{' '}
        </p>
      )}

      {data && (
        <div className="page-margin">
          <ul className="tabs">
            {Object.values(data.Rounds).map(round => {
              return (
                <li
                  key={round.Number}
                  className={
                    `${usedRound}` === `${round.Number}`
                      ? 'tab-selected'
                      : undefined
                  }
                >
                  <Link
                    href={`/competitions/${competition.id}/tee-times?round=${round.Number}`}
                  >
                    <a>{round.Name}</a>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="startlists">
            {Object.values(data.Rounds[`R${usedRound}`].StartLists).map(
              startList => {
                const course = startList.CourseName;

                return (
                  <div key={startList.CourseStart_RID} className="startlist">
                    {getGames(
                      startList.Entries,
                      now,
                      data.CompetitionData.CourseColours,
                    ).map(game => {
                      return (
                        <div className="startlist-game" key={game.number}>
                          <div>
                            <div className="startlist-game-hole">
                              Hole {game.startingHole}
                            </div>
                            <div className="startlist-game-time">
                              {format(game.time, 'HH:mm')}
                            </div>
                            <div className="startlist-game-course">
                              {game.course}
                            </div>
                          </div>
                          <div>
                            <div className="startlist-game-players">
                              {game.players.map(player => {
                                return (
                                  <div key={player.memberId}>
                                    {player.firstName} {player.lastName} —{' '}
                                    <span className="club">
                                      {player.clubName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ params, query }) {
  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(params.competitionId, 10) },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
    },
  });
  if (!competition) {
    return { notFound: true };
  }
  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  const props = { competition };
  if (query.round) {
    props.round = query.round;
  }
  return { props };
}
