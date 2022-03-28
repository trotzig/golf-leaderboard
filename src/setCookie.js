import { serialize } from 'cookie';

export default function setCookie(res, name, value, options) {
  res.setHeader('Set-Cookie', serialize(name, string, options));
}
