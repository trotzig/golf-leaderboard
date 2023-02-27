import { parse, format } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { useJsonPData } from '../../../../src/fetchJsonP.js';
import FavoriteButton from '../../../../src/FavoriteButton.js';
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
        courseCssName: courses.find(c => c.Name === entry.CourseName).CssName,
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
      isFavorite: localStorage.getItem(entry.MemberID),
    });
  }
  return result;
}

function Game({ game }) {
  return (
    <div className="startlist-game" key={game.number}>
      <div className="startlist-game-intro">
        <div className="startlist-game-time">{format(game.time, 'HH:mm')}</div>
        <div className="startlist-game-where">
          <span className={`startlist-game-course ${game.courseCssName}`}>
            {game.course}
          </span>
          {' — '}
          <span className="startlist-game-hole">Hole {game.startingHole}</span>
        </div>
      </div>
      <div className="startlist-game-players">
        {game.players.map(player => {
          return (
            <div key={player.memberId} className="startlist-game-player">
              <FavoriteButton playerId={player.memberId} icon />
              <div>
                {player.firstName} {player.lastName}
                <br />
                <span className="club">{player.clubName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeeTimesPage({ competition, now = new Date(), round }) {
  ensureDates(competition);
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/TeeTimesHandler/GetTeeTimes/CompetitionId/${competition.id}/language/2057/`,
  );
  const loading = !data;
  const usedRound = round || (data && data.ActiveRoundNumber);

  const allGames = [];
  if (data && usedRound) {
    const startLists = Object.values(data.Rounds[`R${usedRound}`].StartLists);
    for (const startList of startLists) {
      const games = getGames(
        startList.Entries,
        now,
        data.CompetitionData.CourseColours,
      );
      allGames.push(...games);
    }
    allGames.sort((a, b) => {
      if (a.time < b.time) {
        return -1;
      }
      if (b.time < a.time) {
        return 1;
      }
      return 0;
    });
  }

  const gamesWithFavorites = allGames.filter(g =>
    g.players.some(p => p.isFavorite),
  );

  return (
    <div className="tee-times-page">
      <Head>
        <title>{competition.name} | Tee times</title>
        <meta
          name="description"
          content={`See tee times for ${competition.name}`}
        />
      </Head>
      <Menu activeHref="/leaderboard" />
      <div className="h-intro">Tee times</div>
      <h2 className="tee-times-page-heading">{competition.name}</h2>
      {competition.venue && (
        <p className="tee-times-page-subtitle">
          {competition.venue} –{' '}
          {competition.start && competitionDateString(competition, now)}.{' '}
        </p>
      )}
      <p className="leaderboard-page-subtitle">
        Switch to{' '}
        <Link href={`/t/${competition.slug}`}>
          <a>leaderboard</a>
        </Link>
        .
      </p>

      {data && (
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
      )}

      {data && data.Rounds ? (
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
                    href={`/t/${competition.slug}/tee-times?round=${round.Number}`}
                  >
                    <a>{round.Name}</a>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="startlists">
            <div className="startlist">
              {gamesWithFavorites.length > 0 && (
                <div>
                  <h3 className="startlist-section-heading">Favorites</h3>
                  {gamesWithFavorites.map(game => {
                    return <Game game={game} key={game.number} />;
                  })}

                  <h3 className="startlist-section-heading">Everyone</h3>
                </div>
              )}
              {allGames.map(game => {
                return <Game game={game} key={game.number} />;
              })}
            </div>
          </div>
        </div>
      ) : loading ? null : (
        <p className="alert page-margin">
          Tee times are not available at the moment.
        </p>
      )}
    </div>
  );
}

export async function getServerSideProps({ params, query }) {
  const competition = await prisma.competition.findUnique({
    where: { slug: params.competitionSlug },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
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
