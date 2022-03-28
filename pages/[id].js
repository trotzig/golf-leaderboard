import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';

import { findPlayer } from '../src/staticData';
import FavoriteButton from '../src/FavoriteButton';
import Menu from '../src/Menu';
import ordinal from '../src/ordinal';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const player = id ? findPlayer(id) : null;

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
            <FavoriteButton playerId={player.memberId} large />
          </div>
        </>
      ) : null}
    </div>
  );
}
