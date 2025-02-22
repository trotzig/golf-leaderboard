import { sendMail } from '../../../src/mailgun';
import prisma from '../../../src/prisma';

const { BASE_URL = 'https://nordicgolftour.app', MAILGUN_DOMAIN } = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts POST requests');
  }
  const { email, favoritedPlayerId } = req.body;
  const token = Math.floor(1000 + Math.random() * 9000);
  const attempt = await prisma.signInAttempt.create({
    data: {
      email,
      token: `${token}`,
      favoritedPlayerId,
    },
  });

  await sendMail({
    subject: `Enter ${token} to sign in to ${MAILGUN_DOMAIN}`,
    text: `
Enter this code to continue signing in to ${MAILGUN_DOMAIN}
${token}

-------------------
This email was sent via ${MAILGUN_DOMAIN}. If you didn't initiate a sign-in, it's safe to ignore this message.
    `.trim(),
    to: email,
  });
  res.status(200).json({ id: attempt.id });
}
