import prisma from '../../../../src/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const { email } = req.body;
  if (req.method === 'POST') {
    console.log('subscribing to', id);
    await prisma.subscription.create({ data: { email, memberId: id } });
  } else if (req.method === 'DELETE') {
    console.log('unsubscribing from', id);
    await prisma.subscription.deleteMany({ where: { email, memberId: id } });
  }
  res.status(204).send();
}
