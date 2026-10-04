import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import FavoriteButton from './FavoriteButton';
import FlagIcon, { getCountryName } from './FlagIcon';
import PlayerPhoto from './PlayerPhoto';
import PlayerStatsChart from './PlayerStatsChart';
import SignInForm from './SignInForm';
import fixParValue from './fixParValue';
import formatCompetitionName from './formatCompetitionName';
import generateSlug from './generateSlug.mjs';
import getPlayerLinks from './playerLinks';
import ordinal from './ordinal';
import useData from './useData';

function getScoresBySeason(items, now) {
  const result = {};
  result[new Date(now).getFullYear()] = []; // always show current season
  for (const item of items) {
    const season = new Date(item.competition.start).getFullYear();
    result[season] = result[season] || [];
    result[season].push(item);
  }
  console.log(result);
  return result;
}

export default function PlayerPage({
  player,
  season: selectedSeason,
  baseUrl,
  photoPath,
  now = Date.now(),
}) {
  const router = useRouter();
  const { id } = router.query;

  const [profile, isLoadingProfile] = useData('/api/profile');
  const [isFavorite, setIsFavorite] = useState();

  useEffect(() => {
    setIsFavorite(localStorage.getItem(player.id));
  }, [player]);

  const playerLinks = getPlayerLinks(player);
  const scoresBySeason = getScoresBySeason(player.competitionScore, now);
  const season =
    selectedSeason ||
    Object.keys(scoresBySeason)[Object.keys(scoresBySeason).length - 1];

  return (
    <div className="player-page">
      <Head>
        <title>{`${player.firstName} ${player.lastName} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}</title>
        <meta
          name="description"
          content={`${player.firstName} ${player.lastName} from ${player.clubName} is competing on the ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Follow their results and subscribe to updates.`}
        />
        <meta
          property="og:title"
          content={`${player.firstName} ${player.lastName} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}
        />
        <meta
          property="og:description"
          content={`${player.firstName} ${player.lastName} from ${player.clubName} is competing on the ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Follow their results and subscribe to updates.`}
        />
        <meta property="og:type" content="profile" />
        {baseUrl && photoPath && (
          <meta
            key="og:image"
            property="og:image"
            content={`${baseUrl}${photoPath}`}
          />
        )}
        {baseUrl && (
          <link rel="canonical" href={`${baseUrl}/${player.slug}`} />
        )}
        <meta
          name="twitter:title"
          content={`${player.firstName} ${player.lastName} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}
        />
        <meta
          name="twitter:description"
          content={`${player.firstName} ${player.lastName} from ${player.clubName} is competing on the ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Follow their results and subscribe to updates.`}
        />
        {baseUrl && photoPath && (
          <meta name="twitter:image" content={`${baseUrl}${photoPath}`} />
        )}
      </Head>
      <div className="player-page-top">
        <PlayerPhoto player={player} />
        <div>
          <h2>
            {player.firstName} {player.lastName}
          </h2>
          <p className="player-page-club">
            <FlagIcon nationality={player.nationality} />
            {player.clubName || getCountryName(player.nationality)}
          </p>
          <FavoriteButton onChange={setIsFavorite} playerId={player.id} large />
        </div>
        {player.oomPosition ? (
          <Link href="/oom" className="player-page-oom">
            <b>{ordinal(player.oomPosition)}</b>
            Order of merit
          </Link>
        ) : null}
      </div>

      {isFavorite && !profile && !isLoadingProfile ? (
        <div className="page-margin">
          <SignInForm
            title={`Sign in to get results from ${player.firstName} by email`}
          />
        </div>
      ) : null}

      {!isFavorite ? null : profile ? (
        <div className="page-margin" style={{ minHeight: 60 }}>
          {profile.sendEmailOnFinished ? (
            <div>
              You are subscribed to results from {player.firstName}. Go to{' '}
              <Link href="/profile">your settings</Link> if you want to change
              this.
            </div>
          ) : (
            <div>
              Go to <Link href="/profile">your settings</Link> if you want to
              subscribe to results from {player.firstName}
            </div>
          )}
        </div>
      ) : null}

      <PlayerStatsChart competitionScores={player.competitionScore} />

      {playerLinks.length > 0 && (
        <>
          <h2 style={{ paddingBottom: 0 }}>Links</h2>
          <div className="page-margin" style={{ paddingTop: 0 }}>
            <ul className="player-page-links">
              {playerLinks.map(link => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <h2>Results</h2>
      <div className="page-margin">
        <ul className="tabs">
          {Object.keys(scoresBySeason).map(year => {
            return (
              <li
                key={year}
                className={`${season}` === `${year}` ? 'tab-selected' : ''}
              >
                <Link scroll={false} href={`/${player.slug}?season=${year}`}>
                  {year}
                </Link>
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
                    <Link href={`/t/${comp.competition.slug}?player=${generateSlug(player)}`}>
                      {formatCompetitionName(comp.competition.name)}
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
