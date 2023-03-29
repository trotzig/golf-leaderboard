import prisma from './prisma';

export default async function profileProps({ req }) {
  const { auth: authToken } = req.cookies;
  if (!authToken) {
    return { props: {} };
  }
  const account = await prisma.account.findUnique({
    where: { authToken },
    select: {
      email: true,
      sendEmailOnStart: true,
      sendEmailOnFinished: true,
      sendEmailOnHotStreak: true,
    },
  });
  if (account && account.email === 'henric.trotzig@gmail.com') {
    account.isAdmin = true;
  }
  return { props: { account } };
}
