import { serialize } from 'cookie';

export default async function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    serialize('auth', 1, {
      httpOnly: true,
      maxAge: 1,
      path: '/',
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
  res.redirect('/');
}
