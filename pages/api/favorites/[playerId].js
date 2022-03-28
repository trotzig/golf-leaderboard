import prisma from '../../../src/prisma';

export default async function handler(req, res) {
  if (!['PUT', 'DELETE'].includes(req.method)) {
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

  const { playerId } = req.query;
  if (req.method === 'DELETE') {
    await prisma.favorite.delete({
      where: { accountId_playerId: { accountId: account.id, playerId } },
    });
  } else {
    await prisma.favorite.create({ data: { accountId: account.id, playerId } });
  }

  res.status(204).send();
}
