import prisma from './prisma.mjs';

const TTL_MS = 5 * 60 * 1000;
let cached;
let cachedAt = 0;
let inflight;

/**
 * Returns a Map of { playerId -> slug } for players whose slug has been
 * overridden with a stable ID-based suffix to resolve a name collision.
 * Only players with a slug ending in the MD5 suffix pattern (-[hex]{3}) are
 * fetched, so this avoids loading the entire player table.
 */
export default async function getCollidingSlugs() {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) {
    return cached;
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    try {
      const players = await prisma.$queryRaw`
        SELECT id, slug FROM "Player" WHERE slug ~ '-[a-f0-9]{3}$'
      `;
      cached = new Map(players.map(p => [p.id, p.slug]));
      cachedAt = Date.now();
      return cached;
    } finally {
      inflight = undefined;
    }
  })();
  return inflight;
}
