import prisma from './prisma';

export default async function profileProps({ req }) {
  const { auth: authToken } = req.cookies;
  if (!authToken) {
    return { props: {} };
  }
  const account = await prisma.account.findUnique({
    where: { authToken },
    select: { email: true, sendEmailOnStart: true, sendEmailOnFinished: true },
  });
  return { props: { account } };
}
