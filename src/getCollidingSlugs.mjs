import prisma from './prisma.mjs';

/**
 * Returns a Map of { playerId -> slug } for players whose slug has been
 * overridden with a stable ID-based suffix to resolve a name collision.
 * Only players with a slug ending in the MD5 suffix pattern (-[hex]{3}) are
 * fetched, so this avoids loading the entire player table.
 */
export default async function getCollidingSlugs() {
  const players = await prisma.$queryRaw`
    SELECT id, slug FROM "Player" WHERE slug ~ '-[a-f0-9]{3}$'
  `;
  return new Map(players.map(p => [p.id, p.slug]));
}
