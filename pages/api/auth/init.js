import prisma from '../../../src/prisma';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { email } = req.body;
  const confirmToken = crypto.randomBytes(10).toString('hex');
  const account =
    (await prisma.account.findUnique({ where: { email } })) ||
    (await prisma.account.create({
      data: {
        email,
        confirmToken,
      },
    }));

  if (!account.confirmToken) {
    await prisma.account.update({
      where: { id: account.id },
      data: { confirmToken },
    });
  }

  const checkToken = crypto.randomBytes(10).toString('hex');
  await prisma.account.update({
    where: { id: account.id },
    data: { checkToken },
  });
  console.log(
    'Send this email',
    `
Click this link to continue the sign-in process at nordicgolftour.app:
http://localhost:3000/api/auth/confirm?confirmToken=${confirmToken}&checkToken=${checkToken}
    `.trim(),
  );
  res.status(200).json({ checkToken });
}
