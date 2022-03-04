export default function fixParValue(val) {
  if (val === 'Par') {
    return 'E';
  }
  return val;
}
