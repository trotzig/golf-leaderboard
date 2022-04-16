import crypto from 'crypto';

import prisma from '../../src/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(400).send('This endpoint accepts GET requests');
  }
  const { token } = req.query;
  await prisma.account.update({
    where: { authToken: token },
    data: { sendEmailOnFinished: false },
  });
  res.redirect('/unsubscribed');
}
