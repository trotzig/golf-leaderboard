import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

import FavoriteButton from '../src/FavoriteButton';
import Menu from '../src/Menu';
import ordinal from '../src/ordinal';
import useData from '../src/useData.js';

const NUM_FORMATTER = Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function Player({ player, onFavorite, lastFavoriteChanged }) {
  const classes = ['player'];
  if (player.isFavorite) {
    classes.push('favorite-player');
  }

  return (
    <li className={classes.join(' ')}>
      <span className="favorite-wrapper">
        <FavoriteButton
          onChange={onFavorite}
          playerId={player.id}
          lastFavoriteChanged={lastFavoriteChanged}
        />
      </span>
      <Link href={`/${player.slug}`}>
        <a>
          {player.firstName} {player.lastName}
          <br />
          <span className="club">{player.clubName}</span>
        </a>
      </Link>
      <Link href="/oom">
        <a className="oom-position">{ordinal(player.oomPosition)}</a>
      </Link>
    </li>
  );
}

export default function PlayersPage() {
  const router = useRouter();
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const [players, setPlayers] = useState([]);
  const { sortBy = 'lastName', filter = '' } = router.query;
  const [currentFilter, setCurrentFilter] = useState(filter);

  useEffect(() => {
    if (filter) {
      setCurrentFilter(filter);
    }
  }, [filter])

  function handleFavoriteChange(favorite, playerId) {
    setLastFavoriteChanged(new Date());
  }

  const [rawPlayers] = useData('/api/players');

  useEffect(() => {
    if (!rawPlayers) {
      return;
    }
    const unchangedPlayers = rawPlayers;
    const result = [];
    for (const player of unchangedPlayers) {
      result.push({
        ...player,
        isFavorite: localStorage && localStorage.getItem(player.id),
      });
    }
    result.sort((a, b) => {
      let av = a[sortBy] || 'zzz';
      let bv = b[sortBy] || 'zzz';
      if (sortBy === 'oomPosition') {
        av = parseInt(a.oomPosition.replace(/^T/, ''), 10);
        bv = parseInt(b.oomPosition.replace(/^T/, ''), 10);
        if (isNaN(av)) av = 99999999;
        if (isNaN(bv)) bv = 99999999;
      }
      if (av < bv) {
        return -1;
      }
      if (av > bv) {
        return 1;
      }
      return 0;
    });
    setPlayers(
      result.filter(p => {
        if (!filter) {
          return true;
        }
        const lowerFilter = filter.toLowerCase();
        return (
          p.firstName.toLowerCase().includes(lowerFilter) ||
          p.lastName.toLowerCase().includes(lowerFilter) ||
          p.clubName.toLowerCase().includes(lowerFilter)
        );
      }),
    );
  }, [lastFavoriteChanged, sortBy, filter, rawPlayers]);

  const debouncedSetFilter = useMemo(
    () =>
      debounce(filter => {
        router.replace(
          `/players?filter=${encodeURIComponent(filter)}&sortBy=${sortBy}`,
          undefined,
          { scroll: false },
        );
      }, 250),
    [sortBy],
  );

  function handleSearchChange(e) {
    setCurrentFilter(e.target.value);
    debouncedSetFilter(e.target.value);
  }

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
      <div className="page-margin sort-by">
        <span>Sort by</span>
        <select
          value={sortBy}
          onChange={e => {
            router.replace(
              `/players?sortBy=${e.target.value}&filter=${encodeURIComponent(
                filter,
              )}`,
              undefined,
              { scroll: false },
            );
          }}
        >
          <option value="lastName">Last name</option>
          <option value="firstName">First name</option>
          <option value="clubName">Club</option>
          <option value="oomPosition">Ranking</option>
        </select>

        <span>Search</span>
        <input
          className="search-input"
          onChange={handleSearchChange}
          type="text"
          value={currentFilter}
        />
      </div>
      {players ? (
        <>
          {favorites.length > 0 ? (
            <>
              <h3 className="leaderboard-section-heading">Favorites</h3>
              <ul>
                {favorites.map(player => {
                  return (
                    <Player
                      key={player.id}
                      player={player}
                      onFavorite={handleFavoriteChange}
                      lastFavoriteChanged={lastFavoriteChanged}
                    />
                  );
                })}
              </ul>
              <h3 className="leaderboard-section-heading">Everyone</h3>
            </>
          ) : null}

          {filter && players.length === 0 ? (
            <div className="alert page-margin">
              It doesn't look like we have any matches for "{filter}". Try a
              different search term.
            </div>
          ) : null}
          <ul>
            {players.map(player => {
              return (
                <Player
                  key={player.id}
                  player={player}
                  onFavorite={handleFavoriteChange}
                  lastFavoriteChanged={lastFavoriteChanged}
                />
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
