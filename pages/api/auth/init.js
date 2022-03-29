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
    subject: 'Sign in to nordicgolftour.app',
    text: `
Click the link below to continue the sign-in process:

${BASE_URL}/api/auth/confirm?token=${token}

-------------------
This email was sent via nordicgolftour.app. If you didn't initiate a sign-in, it's safe to ignore this message.
    `.trim(),
    to: email,
  });
  res.status(200).json({ id: attempt.id });
}
