import prisma from '../../src/prisma';

export default async function handler(req, res) {
  const { auth: authToken } = req.cookies;
  if (!authToken) {
    return res.status(401).send();
  }
  const account = await prisma.account.findUnique({ where: { authToken }});
  if (!account) {
    return res.status(401).send();
  }

  const { email } = account;
  res.json({ email });
}
