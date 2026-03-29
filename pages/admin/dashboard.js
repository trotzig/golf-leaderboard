import React from 'react';
import { useRouter } from 'next/router';
import prisma from '../../src/prisma';

const ADMIN_EMAILS = ['henric.trotzig@gmail.com', 'henric.persson@gmail.com'];

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboard({
  recentSignIns,
  topSubscribers,
  topFavoritedPlayers,
  mostActivePlayers,
  lowestAvgScorePlayers,
  minComps,
}) {
  const router = useRouter();

  function handleMinCompsChange(e) {
    router.push({ query: { minComps: e.target.value } }, undefined, { scroll: false });
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin dashboard</h2>

      <div className="admin-grid">
        <div>
          <h3>Latest sign-ups</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {recentSignIns.map((row, i) => (
                <tr key={i}>
                  <td>{row.email}</td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Most subscribed accounts</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Favorites</th>
              </tr>
            </thead>
            <tbody>
              {topSubscribers.map((row, i) => (
                <tr key={i}>
                  <td>{row.email}</td>
                  <td>{row.favoriteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Most favorited players</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Favorites</th>
              </tr>
            </thead>
            <tbody>
              {topFavoritedPlayers.map((row, i) => (
                <tr key={i}>
                  <td>
                    <a href={`/${row.slug}`}>
                      {row.firstName} {row.lastName}
                    </a>
                  </td>
                  <td>{row.favoriteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Most competitions played</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Competitions</th>
              </tr>
            </thead>
            <tbody>
              {mostActivePlayers.map((row, i) => (
                <tr key={i}>
                  <td>
                    <a href={`/${row.slug}`}>
                      {row.firstName} {row.lastName}
                    </a>
                  </td>
                  <td>{row.competitionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3>Lowest average score</h3>
          <label className="admin-select-label">
            Min competitions:{' '}
            <select value={minComps} onChange={handleMinCompsChange}>
              {Array.from({ length: 40 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Avg score</th>
              </tr>
            </thead>
            <tbody>
              {lowestAvgScorePlayers.map((row, i) => (
                <tr key={i}>
                  <td>
                    <a href={`/${row.slug}`}>
                      {row.firstName} {row.lastName}
                    </a>
                  </td>
                  <td>{row.avgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, query }) {
  const { auth: authToken } = req.cookies;
  if (!authToken) {
    return { notFound: true };
  }
  const account = await prisma.account.findUnique({ where: { authToken } });
  if (!account || !ADMIN_EMAILS.includes(account.email)) {
    return { notFound: true };
  }

  const minComps = Math.min(40, Math.max(1, parseInt(query.minComps, 10) || 10));

  const [recentSignIns, topSubscribers, topFavoritedPlayers, mostActivePlayers, lowestAvgScorePlayers] = await Promise.all([
    prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { email: true, createdAt: true },
    }),

    prisma.account.findMany({
      take: 10,
      orderBy: { favorites: { _count: 'desc' } },
      select: {
        email: true,
        _count: { select: { favorites: true } },
      },
    }),

    prisma.player.findMany({
      take: 10,
      orderBy: { favorites: { _count: 'desc' } },
      select: {
        firstName: true,
        lastName: true,
        slug: true,
        _count: { select: { favorites: true } },
      },
    }),

    prisma.player.findMany({
      take: 10,
      orderBy: { competitionScore: { _count: 'desc' } },
      select: {
        firstName: true,
        lastName: true,
        slug: true,
        _count: { select: { competitionScore: true } },
      },
    }),

    prisma.$queryRaw`
      SELECT p."firstName", p."lastName", p.slug, AVG(pcs.score) / 10000.0 AS "avgScore"
      FROM "Player" p
      JOIN "PlayerCompetitionScore" pcs ON pcs."playerId" = p.id
      GROUP BY p.id, p."firstName", p."lastName", p.slug
      HAVING COUNT(*) >= ${minComps}
      ORDER BY AVG(pcs.score) ASC
      LIMIT 10
    `,
  ]);

  return {
    props: {
      recentSignIns: recentSignIns.map(r => ({
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      })),
      topSubscribers: topSubscribers.map(a => ({
        email: a.email,
        favoriteCount: a._count.favorites,
      })),
      topFavoritedPlayers: topFavoritedPlayers.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        slug: p.slug,
        favoriteCount: p._count.favorites,
      })),
      mostActivePlayers: mostActivePlayers.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        slug: p.slug,
        competitionCount: p._count.competitionScore,
      })),
      lowestAvgScorePlayers: lowestAvgScorePlayers.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        slug: p.slug,
        avgScore: parseFloat(p.avgScore).toFixed(1),
      })),
      minComps,
    },
  };
}
