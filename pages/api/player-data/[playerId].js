import prisma from '../../../src/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(400).send('This endpoint accepts GET requests');
  }

  const { playerId } = req.query;
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      clubName: true,
    },
  });

  if (!player) {
    return res.status(404).send(`No player with id ${playerId}`);
  }

  res.json(player);
}
