import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

import FavoriteButton from '../src/FavoriteButton';
import FlagIcon, { getCountryName } from '../src/FlagIcon';
import ordinal from '../src/ordinal';
import prisma from '../src/prisma';
import profileProps from '../src/profileProps.js';
import syncFavorites from '../src/syncFavorites.js';

const PAGE_SIZE = 50;

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
        {player.firstName} {player.lastName}
        <br />
        <span className="club">
          <FlagIcon nationality={player.nationality} />
          {player.clubName || getCountryName(player.nationality)}
        </span>
      </Link>
      <Link href="/oom" className="oom-position">
        {ordinal(player.oomPosition)}
      </Link>
    </li>
  );
}

export default function PlayersPage({ account, players: rawPlayers }) {
  const router = useRouter();
  const [lastFavoriteChanged, setLastFavoriteChanged] = useState();
  const [players, setPlayers] = useState(rawPlayers);
  const { sortBy = 'lastName', filter = '', years = '3' } = router.query;
  const [currentFilter, setCurrentFilter] = useState(filter);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (filter) {
      setCurrentFilter(filter);
    }
  }, [filter]);

  function handleFavoriteChange(favorite, playerId) {
    setLastFavoriteChanged(new Date());
  }

  useEffect(() => {
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
        av = parseInt(a.oomPosition?.replace(/^T/, ''), 10);
        bv = parseInt(b.oomPosition?.replace(/^T/, ''), 10);
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
        const fName = p.firstName.toLowerCase();
        const lName = p.lastName.toLowerCase();
        return (
          fName.includes(lowerFilter) ||
          lName.includes(lowerFilter) ||
          p.clubName.toLowerCase().includes(lowerFilter) ||
          lowerFilter
            .split(' ')
            .every(t => fName.includes(t) || lName.includes(t))
        );
      }),
    );
  }, [lastFavoriteChanged, sortBy, filter, rawPlayers]);

  useEffect(() => {
    async function run() {
      await syncFavorites();
      setLastFavoriteChanged(new Date());
    }
    run();
  }, []);

  // Reset visible count when filter or sort changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortBy, filter]);

  // Infinite scroll: expand visible count when sentinel scrolls into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => c + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, []);

  const debouncedSetFilter = useMemo(
    () =>
      debounce(filter => {
        router.replace(
          `/players?filter=${encodeURIComponent(filter)}&sortBy=${sortBy}&years=${years}`,
          undefined,
          { scroll: false, shallow: true },
        );
      }, 250),
    [sortBy, years],
  );

  function handleSearchChange(e) {
    setCurrentFilter(e.target.value);
    debouncedSetFilter(e.target.value);
  }

  function handleYearsChange(e) {
    router.replace(
      `/players?years=${e.target.value}&sortBy=${sortBy}&filter=${encodeURIComponent(filter)}`,
      undefined,
      { scroll: false },
    );
  }

  const favorites = players.filter(e => e.isFavorite);
  const visiblePlayers = players.slice(0, visibleCount);
  return (
    <div className="players">
      <Head>
        <title>{`Players | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}</title>
        <meta
          name="description"
          content={`Browse all players competing in ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Follow your favorites and subscribe to email updates.`}
        />
        <meta
          property="og:title"
          content={`Players | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}
        />
        <meta
          property="og:description"
          content={`Browse all players competing in ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Follow your favorites and subscribe to email updates.`}
        />
        <meta property="og:type" content="website" />
        <meta
          name="twitter:title"
          content={`Players | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}
        />
        <meta
          name="twitter:description"
          content={`Browse all players competing in ${process.env.NEXT_PUBLIC_INTRO_TITLE}. Follow your favorites and subscribe to email updates.`}
        />
      </Head>
      <h2>Players</h2>
      <p className="page-desc" style={{ marginBottom: 15 }}>
        Showing players with an active participation{' '}
        <select
          value={years}
          onChange={handleYearsChange}
          style={{
            font: 'inherit',
            border: 'none',
            borderBottom: '1px solid currentColor',
            borderRadius: 0,
            background: 'transparent',
            cursor: 'pointer',
            padding: '0 2px',
          }}
        >
          <option value="1">in the current season</option>
          <option value="2">in the last 2 seasons</option>
          <option value="3">in the last 3 seasons</option>
          <option value="5">in the last 5 seasons</option>

        </select>
        .{' '}
        {!account ? (
          <>
            <Link href="/sign-in">Sign in</Link> to synchronize your favorites
            across different devices and opt in to email notifications from
            them.
          </>
        ) : null}
      </p>
      <div className="page-margin sort-by">
        <label>
          <span>Search</span>
          <input
            className="search-input"
            onChange={handleSearchChange}
            type="text"
            value={currentFilter}
          />
        </label>
        <label>
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={e => {
              router.replace(
                `/players?sortBy=${e.target.value}&filter=${encodeURIComponent(filter)}&years=${years}`,
                undefined,
                { scroll: false, shallow: true },
              );
            }}
          >
            <option value="lastName">Last name</option>
            <option value="firstName">First name</option>
            <option value="clubName">Club</option>
            <option value="oomPosition">Ranking</option>
          </select>
        </label>
      </div>
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
          {visiblePlayers.map(player => {
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
        <div ref={sentinelRef} />
      </>
    </div>
  );
}

export async function getServerSideProps({ req, query }) {
  const years = query.years || '3';
  const since =
    years === 'all'
      ? null
      : new Date(new Date().getFullYear() - (parseInt(years, 10) - 1), 0, 1);

  const [
    {
      props: { account },
    },
    players,
  ] = await Promise.all([
    profileProps({ req }),
    prisma.player.findMany({
      where: since
        ? {
            OR: [
              {
                leaderBoardEntries: {
                  some: { competition: { start: { gte: since } } },
                },
              },
              {
                competitionScore: {
                  some: { competition: { start: { gte: since } } },
                },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        clubName: true,
        nationality: true,
        oomPosition: true,
      },
    }),
  ]);
  return { props: { account: account || null, players } };
}
