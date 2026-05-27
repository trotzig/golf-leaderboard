// Compute strokes-to-par for one hole. Works for both stroke play and
// stableford competitions: GolfBox's Result.ToParValue speaks in
// stableford-point space for stableford events (e.g. a double bogey shows
// up as -2), so we use raw strokes (Score.Value) minus Par instead.
export function describeHoleScore({ Par, Score }) {
  if (!Score || typeof Score.Value !== 'number' || typeof Par !== 'number') {
    return { toParValue: undefined, strokes: undefined, scoreText: 'other' };
  }
  const strokes = Score.Value;
  const toParValue = strokes - Par;
  const scoreText =
    strokes === 1
      ? 'a hole-in-one'
      : toParValue === -3
      ? 'an albatross'
      : toParValue === -2
      ? 'an eagle'
      : toParValue === -1
      ? 'a birdie'
      : toParValue === 0
      ? 'a par'
      : toParValue === 1
      ? 'a bogey'
      : toParValue === 2
      ? 'a double bogey'
      : toParValue === 3
      ? 'a triple bogey'
      : 'other';
  return { toParValue, strokes, scoreText };
}
