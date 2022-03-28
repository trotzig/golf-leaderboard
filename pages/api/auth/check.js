import prisma from '../../../src/prisma';
import crypto from 'crypto';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { signInAttemptId } = req.body;
  const attempt = await prisma.signInAttempt.findUnique({
    where: { id: signInAttemptId },
  });
  if (!attempt) {
    return res.status(400).send('No attempt');
  }
  if (!attempt.confirmedAt) {
    return res.status(400).send('Not confirmed');
  }
  const { email } = attempt;
  const account = await prisma.account.findUnique({ where: { email }});
  if (!account) {
    return res.status(400).send('No account');
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
