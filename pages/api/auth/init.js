import emailTemplates from '../../../src/emails/emailTemplates.mjs';
import { sendMail } from '../../../src/mailgun';
import { generateCode, normalizeEmail } from '../../../src/signIn.mjs';
import prisma from '../../../src/prisma';

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
    ...emailTemplates['sign-in-code']({ code: token }),
    to: email,
  });
  res.status(200).json({ id: attempt.id });
}
