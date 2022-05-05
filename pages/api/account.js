import prisma from '../../src/prisma';

export default async function handler(req, res) {
  if (!req.method === 'PATCH') {
    return res.status('400').send();
  }
  const { auth: authToken } = req.cookies;
  if (!authToken) {
    return res.status(401).send();
  }
  const { sendEmailOnFinished, sendEmailOnStart } = req.body;
  await prisma.account.update({
    where: { authToken },
    data: { sendEmailOnFinished, sendEmailOnStart },
  });
  res.status(204).send();
}
