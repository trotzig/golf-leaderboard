import prisma from '../../../src/prisma';
import crypto from 'crypto';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { checkToken } = req.body;
  const account = await prisma.account.findUnique({ where: { checkToken } });
  if (!account) {
    return res.status(400).send('No account');
  }
  if (!account.authToken) {
    return res.status(400).send('Account not confirmed yet');
  }
  if (!account.confirmToken) {
    return res.status(400).send('No confirmToken');
  }
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
  res.status(204).send();
}
