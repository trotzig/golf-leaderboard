import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { findPlayer } from '../src/staticData';
import FavoriteButton from '../src/FavoriteButton';
import Menu from '../src/Menu';
import SignInForm from '../src/SignInForm';
import fixParValue from '../src/fixParValue';
import ordinal from '../src/ordinal';
import useData from '../src/useData';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const player = id ? findPlayer(id) : null;

  const [profile, isLoadingProfile] = useData('/api/profile');
  const [isFavorite, setIsFavorite] = useState();

  useEffect(() => {
    if (!player) {
      return;
    }
    setIsFavorite(localStorage.getItem(player.memberId));
  }, [player]);

  return (
    <div className="player-page">
      <Head>
        {player ? (
          <title>
            {player.firstName} {player.lastName}
          </title>
        ) : null}
      </Head>
      <Menu />
      {player ? (
        <>
          <div className="player-page-top">
            <div>
              <h2>
                {player.firstName} {player.lastName}
              </h2>
              <p className="player-page-club">{player.clubName}</p>
            </div>
            <Link href="/oom">
              <a className="player-page-oom">
                <b>{ordinal(player.oomPosition)}</b>
                Order of merit
              </a>
            </Link>
          </div>
          <div className="page-margin" style={{ marginBottom: 30 }}>
            <FavoriteButton
              onChange={setIsFavorite}
              playerId={player.memberId}
              large
            />
          </div>
        </>
      ) : null}

      {isFavorite && !profile && !isLoadingProfile ? (
        <div className="page-margin">
          <SignInForm
            title={`Sign in to subscribe to results from ${player.firstName}`}
          />
        </div>
      ) : null}

      {!isFavorite ? null : profile ? (
        <div className="page-margin" style={{ minHeight: 60 }}>
          {profile.sendEmailOnFinished ? (
            <div>
              You are subscribed to results from {player.firstName}. Go to{' '}
              <Link href="/profile">
                <a>your settings</a>
              </Link>{' '}
              if you want to change this.
            </div>
          ) : (
            <div>
              Go to{' '}
              <Link href="/profile">
                <a>your settings</a>
              </Link>{' '}
              if you want to subscribe to results from {player.firstName}
            </div>
          )}
        </div>
      ) : null}

      <h2>Results</h2>
      {player && (
        <table className="page-margin results-table">
          <thead>
            <tr>
              <th>Competition</th>
              <th>Position</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {player.competitions.map(comp => {
              return (
                <tr key={comp.name}>
                  <td className="results-table-competition">
                    <Link href={`/competitions/${comp.id}?finished=1`}>
                      <a>
                        {comp.name}
                        <div>{comp.course}</div>
                      </a>
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
      )}
    </div>
  );
}
