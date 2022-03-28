import prisma from '../../../src/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { auth: authToken } = req.cookies;
  if (!authToken) {
    return res.status(401).send();
  }
  const account = await prisma.account.findUnique({ where: { authToken } });
  if (!account) {
    return res.status(400).send('No account');
  }

  const { favorites } = req.body;
  await prisma.favorite.createMany({
    data: favorites.map(playerId => ({ playerId, accountId: account.id })),
    skipDuplicates: true,
  });

  const all = await prisma.favorite.findMany({ where: { accountId: account.id } });
  res.json({ favorites: all.map(f => f.playerId) });
}
