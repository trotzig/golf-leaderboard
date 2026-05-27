import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectFormat, isGoodScore, isStablefordText } from './competitionFormat.mjs';

test('isStablefordText matches stableford ToParText', () => {
  assert.equal(isStablefordText('+4p'), true);
  assert.equal(isStablefordText('-1p'), true);
  assert.equal(isStablefordText('0p'), true);
  assert.equal(isStablefordText('E'), false);
  assert.equal(isStablefordText('Par'), false);
  assert.equal(isStablefordText('-3'), false);
  assert.equal(isStablefordText('+2'), false);
  assert.equal(isStablefordText(null), false);
});

test('detectFormat reads stableford from LivescoringSettings StatusText', () => {
  const competitionData = {
    CompetitionData: {
      LivescoringSettings: {
        ClassSettings: [{ StatusText: 'Match format is Stableford' }],
      },
    },
  };
  assert.equal(detectFormat({ competitionData }), 'stableford');
});

test('detectFormat falls back to entry ResultSum.ToParText', () => {
  const entries = [{ ResultSum: { ToParText: 'E' } }, { ResultSum: { ToParText: '+4p' } }];
  assert.equal(detectFormat({ entries }), 'stableford');
});

test('detectFormat falls back to scoreTexts array', () => {
  assert.equal(detectFormat({ scoreTexts: ['E', '-1p'] }), 'stableford');
  assert.equal(detectFormat({ scoreTexts: ['E', '-3', '+2'] }), 'strokeplay');
});

test('detectFormat defaults to strokeplay', () => {
  assert.equal(detectFormat({}), 'strokeplay');
  assert.equal(detectFormat({ entries: [] }), 'strokeplay');
});

test('isGoodScore inverts for stableford', () => {
  assert.equal(isGoodScore('strokeplay', -3), true);
  assert.equal(isGoodScore('strokeplay', 2), false);
  assert.equal(isGoodScore('stableford', 4), true);
  assert.equal(isGoodScore('stableford', -1), false);
  assert.equal(isGoodScore('strokeplay', 0), false);
  assert.equal(isGoodScore('stableford', 0), false);
});
