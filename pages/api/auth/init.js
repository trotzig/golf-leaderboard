import prisma from '../../../src/prisma';
import crypto from 'crypto';

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

  console.log(
    'Send this email',
    `
Click this link to continue the sign-in process at nordicgolftour.app:
http://localhost:3000/api/auth/confirm?token=${token}
    `.trim(),
  );
  res.status(200).json({ id: attempt.id });
}
