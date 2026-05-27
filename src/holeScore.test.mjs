import { test } from 'node:test';
import assert from 'node:assert/strict';

import { describeHoleScore } from './holeScore.mjs';

// Stroke play: Result.ToParValue equals strokes-to-par.
test('describeHoleScore identifies a stroke-play eagle', () => {
  const hole = {
    Par: 5,
    Result: { ToParValue: -2, ActualValue: 3 },
    Score: { Value: 3 },
  };
  assert.equal(describeHoleScore(hole).scoreText, 'an eagle');
  assert.equal(describeHoleScore(hole).toParValue, -2);
});

test('describeHoleScore identifies a stroke-play double bogey', () => {
  const hole = {
    Par: 4,
    Result: { ToParValue: 2, ActualValue: 6 },
    Score: { Value: 6 },
  };
  assert.equal(describeHoleScore(hole).scoreText, 'a double bogey');
});

// Stableford: GolfBox returns Result.ToParValue in stableford-point space
// (a double bogey = 0 stableford points = -2 in that space), so the
// previous implementation reported eagles instead of double bogeys.
test('describeHoleScore identifies a stableford double bogey', () => {
  const hole = {
    Par: 4,
    Result: { ToParValue: -2, ActualValue: 0 }, // 0 stableford points
    Score: { Value: 6 },
  };
  assert.equal(describeHoleScore(hole).scoreText, 'a double bogey');
  assert.equal(describeHoleScore(hole).toParValue, 2);
});

test('describeHoleScore identifies a stableford birdie', () => {
  // From real Trust Forsikring data: par 3, two-stroke score, 3 stableford pts
  const hole = {
    Par: 3,
    Result: { ToParValue: 1, ActualValue: 3 },
    Score: { Value: 2 },
  };
  assert.equal(describeHoleScore(hole).scoreText, 'a birdie');
});

test('describeHoleScore identifies a hole-in-one regardless of format', () => {
  const hole = {
    Par: 3,
    Result: { ToParValue: 3, ActualValue: 5 }, // stableford "ace" = 5 pts
    Score: { Value: 1 },
  };
  assert.equal(describeHoleScore(hole).scoreText, 'a hole-in-one');
});
