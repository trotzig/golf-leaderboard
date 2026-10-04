// GolfBox responses are JavaScript-flavoured JSON with minified booleans:
// `!0` is true and `!1` is false. Swap them for real JSON booleans, leaving
// string values untouched.
export default function parseJson(raw) {
  return JSON.parse(
    raw.replace(/"(?:[^"\\]|\\.)*"|!([01])/g, (match, digit) => {
      if (digit === undefined) return match;
      return digit === '0' ? 'true' : 'false';
    }),
  );
}
