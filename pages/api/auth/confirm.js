import prisma from '../../../src/prisma';
import crypto from 'crypto';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(400).send('This endpoint accepts GET requests');
  }
  const { confirmToken, checkToken } = req.query;
  const account = await prisma.account.findUnique({
    where: { confirmToken },
  });
  if (!account || account.checkToken !== checkToken) {
    return res.redirect('/auth/invalid-token');
  }
  if (!account.authToken) {
    const authToken = crypto.randomBytes(10).toString('hex');
    await prisma.account.update({
      where: { id: account.id },
      data: {
        confirmedAt: new Date(),
        authToken,
      },
    });
  }
  res.setHeader(
    'Set-Cookie',
    serialize('auth', account.authToken || authToken, {
      httpOnly: true,
      maxAge: 2592000,
      path: '/',
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
  res.redirect('/auth/confirmed');
}
