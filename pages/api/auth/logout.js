import { clearAuthCookie } from '../../../src/authCookie.mjs';

export default async function handler(req, res) {
  clearAuthCookie(res);
  res.redirect('/');
}
