import { stringifySetCookie } from 'cookie';

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

function authCookie(value, maxAge) {
  return stringifySetCookie({
    name: 'auth',
    value,
    httpOnly: true,
    maxAge,
    path: '/',
    // Lax (not Strict) so that the cookie is sent when following links from
    // notification emails.
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function setAuthCookie(res, authToken) {
  res.setHeader('Set-Cookie', authCookie(authToken, ONE_YEAR_IN_SECONDS));
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', authCookie('', 0));
}
