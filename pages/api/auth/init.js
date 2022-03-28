import crypto from 'crypto';

import { sendMail } from '../../../src/mailgun';
import prisma from '../../../src/prisma';

const { BASE_URL = 'https://nordicgolftour.app' } = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { email } = req.body;
  const token = crypto.randomBytes(10).toString('hex');
  const attempt = await prisma.signInAttempt.create({
    data: {
      email,
      token,
    },
  });

  await sendMail({
    text: `
Click this link to continue the sign-in process at nordicgolftour.app:

${BASE_URL}/api/auth/confirm?token=${token}
    `.trim(),
    subject: 'Sign in to nordicgolftour.app',
    to: email,
  });
  res.status(200).json({ id: attempt.id });
}
