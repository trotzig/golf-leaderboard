import { stringifySetCookie } from 'cookie';

export default function setCookie(res, name, value, options) {
  res.setHeader('Set-Cookie', stringifySetCookie({ ...options, name, value }));
}
