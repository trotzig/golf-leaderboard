import { expect, test } from 'vitest';

import { detectFormat, isGoodScore, isStablefordText } from './competitionFormat.mjs';

test('isStablefordText matches stableford ToParText', () => {
  expect(isStablefordText('+4p')).toBe(true);
  expect(isStablefordText('-1p')).toBe(true);
  expect(isStablefordText('0p')).toBe(true);
  expect(isStablefordText('E')).toBe(false);
  expect(isStablefordText('Par')).toBe(false);
  expect(isStablefordText('-3')).toBe(false);
  expect(isStablefordText('+2')).toBe(false);
  expect(isStablefordText(null)).toBe(false);
});

test('detectFormat reads stableford from LivescoringSettings StatusText', () => {
  const competitionData = {
    CompetitionData: {
      LivescoringSettings: {
        ClassSettings: [{ StatusText: 'Match format is Stableford' }],
      },
    },
  };
  expect(detectFormat({ competitionData })).toBe('stableford');
});

test('detectFormat falls back to entry ResultSum.ToParText', () => {
  const entries = [{ ResultSum: { ToParText: 'E' } }, { ResultSum: { ToParText: '+4p' } }];
  expect(detectFormat({ entries })).toBe('stableford');
});

test('detectFormat falls back to scoreTexts array', () => {
  expect(detectFormat({ scoreTexts: ['E', '-1p'] })).toBe('stableford');
  expect(detectFormat({ scoreTexts: ['E', '-3', '+2'] })).toBe('strokeplay');
});

test('detectFormat defaults to strokeplay', () => {
  expect(detectFormat({})).toBe('strokeplay');
  expect(detectFormat({ entries: [] })).toBe('strokeplay');
});

test('isGoodScore inverts for stableford', () => {
  expect(isGoodScore('strokeplay', -3)).toBe(true);
  expect(isGoodScore('strokeplay', 2)).toBe(false);
  expect(isGoodScore('stableford', 4)).toBe(true);
  expect(isGoodScore('stableford', -1)).toBe(false);
  expect(isGoodScore('strokeplay', 0)).toBe(false);
  expect(isGoodScore('stableford', 0)).toBe(false);
});
