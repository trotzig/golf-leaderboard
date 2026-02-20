import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import FavoriteButton from '../src/FavoriteButton';
import Menu from '../src/Menu';
import PlayerPhoto from '../src/PlayerPhoto';
import PlayerStatsChart from '../src/PlayerStatsChart';
import SignInForm from '../src/SignInForm';
import fixParValue from '../src/fixParValue';
import ordinal from '../src/ordinal';
import prisma from '../src/prisma';
import useData from '../src/useData';

function getScoresBySeason(items) {
  const result = {};
  result[new Date().getFullYear()] = []; // always show current season
  for (const item of items) {
    const season = new Date(item.competition.start).getFullYear();
    result[season] = result[season] || [];
    result[season].push(item);
  }
  console.log(result);
  return result;
}

export default function PlayerPage({ player, season: selectedSeason }) {
  const router = useRouter();
  const { id } = router.query;

  const [profile, isLoadingProfile] = useData('/api/profile');
  const [isFavorite, setIsFavorite] = useState();

  useEffect(() => {
    setIsFavorite(localStorage.getItem(player.id));
  }, [player]);

  const scoresBySeason = getScoresBySeason(player.competitionScore);
  const season =
    selectedSeason ||
    Object.keys(scoresBySeason)[Object.keys(scoresBySeason).length - 1];

  return (
    <div className="player-page">
      <Head>
        <title>
          {player.firstName} {player.lastName}
        </title>
        <meta
          name="description"
          content={`${player.firstName} ${player.lastName} from ${player.clubName} is competing in ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Subscribe to updates from the player by adding ${player.firstName} as a favorite.`}
        />
      </Head>
      <Menu activeHref="/players" />
      <div className="player-page-top">
        <PlayerPhoto player={player} />
        <div>
          <h2>
            {player.firstName} {player.lastName}
          </h2>
          <p className="player-page-club">{player.clubName}</p>
          <FavoriteButton onChange={setIsFavorite} playerId={player.id} large />
        </div>
        <Link href="/oom" className="player-page-oom">
          <b>{ordinal(player.oomPosition)}</b>
          Order of merit
        </Link>
      </div>

      {isFavorite && !profile && !isLoadingProfile ? (
        <div className="page-margin">
          <SignInForm
            title={`Sign in to subscribe to results from ${player.firstName}`}
            favoritedPlayerId={player.id}
          />
        </div>
      ) : null}

      {!isFavorite ? null : profile ? (
        <div className="page-margin" style={{ minHeight: 60 }}>
          {profile.sendEmailOnFinished ? (
            <div>
              You are subscribed to results from {player.firstName}. Go to{' '}
              <Link href="/profile">your settings</Link>{' '}
              if you want to change this.
            </div>
          ) : (
            <div>
              Go to{' '}
              <Link href="/profile">your settings</Link>{' '}
              if you want to subscribe to results from {player.firstName}
            </div>
          )}
        </div>
      ) : null}

      <PlayerStatsChart competitionScores={player.competitionScore} />

      <h2>Results</h2>
      <div className="page-margin">
        <ul className="tabs">
          {Object.keys(scoresBySeason).map(year => {
            return (
              <li
                key={year}
                className={
                  `${season}` === `${year}` ? 'tab-selected' : ''
                }
              >
                <Link href={`/${player.slug}?season=${year}`}>{year}</Link>
              </li>
            );
          })}
        </ul>
      </div>
      {(scoresBySeason[season] || []).length ? (
        <table className="page-margin results-table">
          <thead>
            <tr>
              <th>Competition</th>
              <th>Position</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {scoresBySeason[season].map(comp => {
              return (
                <tr key={comp.competition.name}>
                  <td className="results-table-competition">
                    <Link href={`/t/${comp.competition.slug}`}>
                      {comp.competition.name}
                      <div>{comp.competition.course}</div>
                    </Link>
                  </td>
                  <td className="results-table-position">{comp.position}</td>
                  <td
                    className={`results-table-score${
                      comp.score < 0 ? ' under-par' : ''
                    }`}
                  >
                    {fixParValue(comp.scoreText)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="page-margin">
          {player.firstName} hasn't played in any events yet.
        </p>
      )}
    </div>
  );
}

export async function getServerSideProps({ params, query }) {
  const player = await prisma.player.findUnique({
    where: { slug: params.id },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      clubName: true,
      oomPosition: true,
      competitionScore: {
        orderBy: {
          competition: {
            start: 'desc',
          },
        },
        select: {
          position: true,
          playerId: true,
          competitionId: true,
          position: true,
          scoreText: true,
          score: true,
          competition: {
            select: {
              id: true,
              name: true,
              venue: true,
              start: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  if (!player) {
    return { notFound: true };
  }
  for (const item of player.competitionScore) {
    item.competition.start = item.competition.start.toISOString();
  }
  return {
    props: { player, season: query.season || null },
  };
}
