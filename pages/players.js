import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { getAllPlayers } from '../src/staticData';
import Menu from '../src/Menu';

const NUM_FORMATTER = Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function Player({ player, onFavorite }) {
  const classes = ['player'];
  if (player.isFavorite) {
    classes.push('favorite-player');
  }

  return (
    <li className={classes.join(' ')}>
      <span className="favorite-wrapper">
        <button
          className="favorite"
          onClick={() => onFavorite(!player.isFavorite, player.memberId)}
        >
          <svg
            height="24px"
            viewBox="0 0 24 24"
            width="24px"
            fill={
              player.isFavorite
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.2)'
            }
          >
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      </span>
      <Link href={`/${player.slug}`}>
        <a>
          {player.firstName} {player.lastName}
          <br />
          <span className="club">{player.clubName}</span>
        </a>
      </Link>
    </li>
  );
}

export default function PlayersPage() {
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const [players, setPlayers] = useState(getAllPlayers());
  function handleFavoriteChange(favorite, memberId) {
    if (favorite) {
      localStorage.setItem(memberId, '1');
    } else {
      localStorage.removeItem(memberId);
    }
    setLastFavoriteChanged(new Date());
  }

  useEffect(() => {
    const unchangedPlayers = getAllPlayers();
    const result = [];
    for (const player of unchangedPlayers) {
      result.push({
        ...player,
        isFavorite: localStorage && localStorage.getItem(player.memberId),
      });
    }
    setPlayers(result);
  }, [lastFavoriteChanged]);

  const favorites = players.filter(e => e.isFavorite);
  return (
    <div className="players">
      <Head>
        <title>Players</title>
      </Head>
      <Menu />
      <h2>Players</h2>
      <p className="page-margin" style={{ paddingTop: 0 }}>
        Players who have participated in at least one event during the season
        are listed here
      </p>
      {players ? (
        <>
          {favorites.length > 0 ? (
            <>
              <h3 className="leaderboard-section-heading">Favorites</h3>
              <ul>
                {favorites.map(player => {
                  return (
                    <Player
                      key={player.memberId}
                      player={player}
                      onFavorite={handleFavoriteChange}
                    />
                  );
                })}
              </ul>
              <h3 className="leaderboard-section-heading">Everyone</h3>
            </>
          ) : null}

          <ul>
            {players.map(player => {
              return (
                <Player
                  key={player.memberId}
                  player={player}
                  onFavorite={handleFavoriteChange}
                />
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
