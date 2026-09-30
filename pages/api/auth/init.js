import { sendMail } from '../../../src/mailgun';
import { CODE_TTL_MS, generateCode, normalizeEmail } from '../../../src/signIn.mjs';
import prisma from '../../../src/prisma';

const { NEXT_PUBLIC_TITLE = 'Nordic Golf Tour' } = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const email = normalizeEmail(req.body.email);
  if (!email) {
    return res.status(400).json({ error: 'invalid-email' });
  }
  const token = generateCode();
  const attempt = await prisma.signInAttempt.create({
    data: { email, token },
  });

  await sendMail({
    subject: `${token} is your ${NEXT_PUBLIC_TITLE} sign-in code`,
    text: `
Here's your code for signing in to ${NEXT_PUBLIC_TITLE}:

${token}

The code is valid for ${CODE_TTL_MS / (60 * 60 * 1000)} hours.

-------------------
If you didn't try to sign in, it's safe to ignore this message.
    `.trim(),
    to: email,
  });
  res.status(200).json({ id: attempt.id });
}
