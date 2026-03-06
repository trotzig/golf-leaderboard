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
      favorites: {
        select: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  if (account && account.email === 'henric.trotzig@gmail.com') {
    account.isAdmin = true;
  }
  if (account) {
    account.favorites = account.favorites.map(f => f.player);
  }
  return { props: { account } };
}
