import crypto from 'crypto';

import { checkCode } from '../../../src/signIn.mjs';
import { setAuthCookie } from '../../../src/authCookie.mjs';
import prisma from '../../../src/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { token, signInAttemptId } = req.body;
  const attempt = signInAttemptId
    ? await prisma.signInAttempt.findUnique({ where: { id: signInAttemptId } })
    : null;

  const result = checkCode(attempt, token);
  if (result !== 'ok') {
    if (result === 'invalid-code' && attempt) {
      await prisma.signInAttempt.update({
        where: { id: attempt.id },
        data: { failedAttempts: { increment: 1 } },
      });
    }
    return res.status(400).json({ error: result });
  }

  await prisma.signInAttempt.update({
    where: { id: attempt.id },
    data: { confirmedAt: new Date() },
  });

  // Match case-insensitively so that accounts created before emails were
  // normalized are still found.
  let account = await prisma.account.findFirst({
    where: { email: { equals: attempt.email, mode: 'insensitive' } },
    orderBy: { createdAt: 'asc' },
  });
  if (!account) {
    account = await prisma.account.create({
      data: {
        email: attempt.email,
        authToken: crypto.randomBytes(10).toString('hex'),
      },
    });
  } else if (!account.authToken) {
    account = await prisma.account.update({
      where: { id: account.id },
      data: { authToken: crypto.randomBytes(10).toString('hex') },
    });
  }

  setAuthCookie(res, account.authToken);
  res.status(204).send();
}
