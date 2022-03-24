import { useRouter } from 'next/router';
import Head from 'next/head';
import React from 'react';

import { findPlayer } from '../src/staticData';
import Menu from '../src/Menu';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const player = id ? findPlayer(id) : null;
  return (
    <div className="player-profile">
      <Head>
        {player ? (
          <title>
            {player.firstName} {player.lastName}
          </title>
        ) : null}
      </Head>
      <Menu />
      {player ? (
        <h2>
          {player.firstName} {player.lastName}
        </h2>
      ) : null}
    </div>
  );
}
