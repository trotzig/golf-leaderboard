import { expect, test } from 'vitest';

import getCompetitionTour from './getCompetitionTour.mjs';

test('identifies the Cutter & Buck Tour', () => {
  expect(getCompetitionTour([13350, 13361])).toBe('Cutter & Buck Tour');
});

test('identifies the ECCO Tour', () => {
  expect(getCompetitionTour([13360, 13361])).toBe('ECCO Tour');
});

test('returns null for the shared category alone', () => {
  expect(getCompetitionTour([13361])).toBe(null);
});

test('returns null for unknown or co-sanctioned categories', () => {
  expect(getCompetitionTour([13361, 14118])).toBe(null);
});

test('returns null for empty or missing categories', () => {
  expect(getCompetitionTour([])).toBe(null);
  expect(getCompetitionTour(undefined)).toBe(null);
  expect(getCompetitionTour(null)).toBe(null);
});
