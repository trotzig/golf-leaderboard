import prisma from '../../src/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(400).send('This endpoint accepts GET requests');
  }
  const players = await prisma.player.findMany({
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      clubName: true,
      oomPosition: true,
    },
  });
  res.status(200).json(players);
}
