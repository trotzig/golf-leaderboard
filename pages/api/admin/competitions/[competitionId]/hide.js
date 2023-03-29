import prisma from '../../../../../src/prisma';

export default async function handler(req, res) {
  if (!['POST'].includes(req.method)) {
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

  if (!account.email === 'henric.trotzig@gmail.com') {
    return res.status(400).send('Not an admin account');
  }

  const { competitionId } = req.query;
  await prisma.competition.update({
    where: { id: parseInt(competitionId, 10) },
    data: { visible: false },
  });

  res.status(200).send('This competition has been hidden');
}
