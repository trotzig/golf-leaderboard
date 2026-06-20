import prisma from '../../src/prisma';

const unsubscribeData = {
  sendEmailOnFinished: false,
  sendEmailOnStart: false,
  sendEmailOnHotStreak: false,
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(400).send('This endpoint accepts GET and POST requests');
  }
  const { token } = req.query;
  await prisma.account.update({
    where: { authToken: token },
    data: unsubscribeData,
  });
  // One-click unsubscribe (RFC 8058) sends a POST and expects a plain 200
  // response rather than a redirect.
  if (req.method === 'POST') {
    return res.status(200).send('You have been unsubscribed.');
  }
  res.redirect('/unsubscribed');
}
