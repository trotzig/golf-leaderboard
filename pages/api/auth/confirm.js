import prisma from '../../../src/prisma';
import crypto from 'crypto';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(400).send('This endpoint accepts GET requests');
  }
  const { token } = req.query;
  const attempt = await prisma.signInAttempt.findUnique({
    where: { token },
  });
  if (!attempt) {
    return res.redirect('/auth/invalid-token');
  }
  const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
  if (twoHoursAgo > attempt.createdAt) {
    return res.redirect('/auth/invalid-token');
  }
  const { email } = attempt;
  const authToken = crypto.randomBytes(10).toString('hex');
  const account =
    (await prisma.account.findUnique({ where: { email } })) ||
    (await prisma.account.create({ data: { email, authToken } }));

  await prisma.signInAttempt.update({
    where: { id: attempt.id },
    data: { confirmedAt: new Date() },
  });

  res.setHeader(
    'Set-Cookie',
    serialize('auth', account.authToken, {
      httpOnly: true,
      maxAge: 2592000,
      path: '/',
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
  res.redirect('/auth/confirmed');
}
