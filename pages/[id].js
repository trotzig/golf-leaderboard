import { useRouter } from 'next/router';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import { findPlayer } from '../src/staticData';
import Menu from '../src/Menu';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const player = id ? findPlayer(id) : null;
  const [isFavorite, setIsFavorite] = useState();
  useEffect(() => {
    if (!player) {
      return;
    }
    setIsFavorite(localStorage.getItem(player.memberId));
  }, [player]);

  useEffect(() => {
    if (!player) {
      return;
    }
    if (isFavorite) {
      localStorage.setItem(player.memberId, '1');
    } else {
      localStorage.removeItem(player.memberId);
    }
  }, [isFavorite]);
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
          <h2>
            {player.firstName} {player.lastName}
          </h2>
          <p className="page-margin player-page-club">{player.clubName}</p>
          <div className="page-margin">
            <button
              className="icon-button"
              style={{
                backgroundColor: isFavorite ? 'var(--primary)' : undefined,
                color: isFavorite ? '#fff' : undefined,
                borderColor: isFavorite ? undefined : 'currentColor',
                minWidth: 170,
              }}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <svg
                style={{ fill: 'currentColor' }}
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
              >
                <path d="M0 0h24v24H0z" fill="none" stroke="none" />
                <path d="M0 0h24v24H0z" fill="none" stroke="none" />
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {isFavorite ? 'Favorite' : 'Add to favorites'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
