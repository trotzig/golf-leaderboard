import assert from 'node:assert';
import { test } from 'node:test';

import getCompetitionTour from './getCompetitionTour.mjs';

test('identifies the Cutter & Buck Tour', () => {
  assert.strictEqual(getCompetitionTour([13350, 13361]), 'Cutter & Buck Tour');
});

test('identifies the ECCO Tour', () => {
  assert.strictEqual(getCompetitionTour([13360, 13361]), 'ECCO Tour');
});

test('returns null for the shared category alone', () => {
  assert.strictEqual(getCompetitionTour([13361]), null);
});

test('returns null for unknown or co-sanctioned categories', () => {
  assert.strictEqual(getCompetitionTour([13361, 14118]), null);
});

test('returns null for empty or missing categories', () => {
  assert.strictEqual(getCompetitionTour([]), null);
  assert.strictEqual(getCompetitionTour(undefined), null);
  assert.strictEqual(getCompetitionTour(null), null);
});
