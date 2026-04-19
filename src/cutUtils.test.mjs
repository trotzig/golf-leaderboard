import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { countHolesPlayedForEntry, getProjectedCutScore } from './cutUtils.mjs';

describe('countHolesPlayedForEntry', () => {
  describe('using Rounds data', () => {
    it('counts holes from completed rounds up to afterRound', () => {
      const entry = {
        Rounds: {
          R1: { IsCompleted: true },
          R2: { IsCompleted: true },
          R3: { IsCompleted: true },
          R4: { IsCompleted: true },
        },
      };
      // Cut after round 2 — only R1 and R2 should count
      assert.equal(countHolesPlayedForEntry(entry, 2, 2), 36);
    });

    it('ignores rounds beyond afterRound even if completed', () => {
      const entry = {
        Rounds: {
          R1: { IsCompleted: true },
          R2: { IsCompleted: true },
          R3: { IsCompleted: true },
        },
      };
      assert.equal(countHolesPlayedForEntry(entry, 2, 2), 36);
    });

    it('counts individual hole scores for in-progress round', () => {
      const entry = {
        Rounds: {
          R1: { IsCompleted: true },
          R2: {
            IsCompleted: false,
            HoleScores: { H1: 4, H2: 3, H3: 5, 'H-OUT': 12, 'H-IN': null, 'H-TOTAL': 12 },
          },
        },
      };
      // R1 complete (18) + 3 holes in R2 = 21
      assert.equal(countHolesPlayedForEntry(entry, 2, 2), 21);
    });

    it('does not count holes from in-progress round beyond afterRound', () => {
      const entry = {
        Rounds: {
          R1: { IsCompleted: true },
          R2: { IsCompleted: true },
          R3: {
            IsCompleted: false,
            HoleScores: { H1: 4, H2: 3 },
          },
        },
      };
      // R3 is beyond afterRound=2 and must be ignored
      assert.equal(countHolesPlayedForEntry(entry, 3, 2), 36);
    });

    it('returns 0 when no rounds are completed and none have hole scores', () => {
      const entry = {
        Rounds: {
          R1: { IsCompleted: false },
          R2: { IsCompleted: false },
        },
      };
      assert.equal(countHolesPlayedForEntry(entry, 1, 2), 0);
    });
  });

  describe('fallback (no Rounds data)', () => {
    it('counts current round holes plus completed rounds before cut', () => {
      const entry = { ScoringToPar: { HoleValue: 9 } };
      // activeRound=2, afterRound=2 → 1 completed round (R1) + 9 holes in R2
      assert.equal(countHolesPlayedForEntry(entry, 2, 2), 27);
    });

    it('clamps completed rounds at afterRound', () => {
      const entry = { ScoringToPar: { HoleValue: 5 } };
      // activeRound=3, afterRound=2 → only 2 completed rounds counted (not 2)
      assert.equal(countHolesPlayedForEntry(entry, 3, 2), 41);
    });

    it('clamps negative HoleValue (tee-time timestamp) to 0', () => {
      const entry = { ScoringToPar: { HoleValue: -12345 } };
      assert.equal(countHolesPlayedForEntry(entry, 2, 2), 18);
    });

    it('handles missing ScoringToPar', () => {
      const entry = {};
      assert.equal(countHolesPlayedForEntry(entry, 2, 2), 18);
    });
  });
});

describe('getProjectedCutScore', () => {
  function makeEntry(positionActual, toParValue, roundsData) {
    return {
      Position: { Actual: positionActual },
      ScoringToPar: { ToParValue: toParValue, HoleValue: 18 },
      Rounds: roundsData,
    };
  }

  const cutConfig = { Enabled: true, Limit: 2, AfterRound: 2 };
  const cut = { AfterRound: 2 };

  it('returns null when cutConfig is missing', () => {
    assert.equal(getProjectedCutScore(null, cut, [], 2), null);
  });

  it('returns null when no entry sits at the cut line', () => {
    const entries = [makeEntry(1, -50000, { R1: { IsCompleted: true }, R2: { IsCompleted: true } })];
    assert.equal(getProjectedCutScore(cutConfig, cut, entries, 2), null);
  });

  it('does not exceed 1.0 field completion when later rounds have data', () => {
    // Bug scenario: 4-round tournament, cut after R2, we are in R2.
    // R3 and R4 exist in the data but should be ignored.
    const entries = [
      makeEntry(1, -80000, {
        R1: { IsCompleted: true },
        R2: { IsCompleted: true },
        R3: { IsCompleted: true }, // should be ignored
        R4: { IsCompleted: true }, // should be ignored
      }),
      makeEntry(2, -50000, {
        R1: { IsCompleted: true },
        R2: { IsCompleted: true },
        R3: { IsCompleted: true }, // should be ignored
        R4: { IsCompleted: true }, // should be ignored
      }),
    ];
    // If R3/R4 were counted, holesPlayedByField would be 4*2*18=144
    // vs totalFieldHoles=2*2*18=72, giving ratio=2.0 and a wildly wrong projection.
    // With the fix, ratio=1.0 and projected = currentScore * 2 = -10.
    const result = getProjectedCutScore(cutConfig, cut, entries, 2);
    assert.notEqual(result, null);
    // currentScore for cut entry (#2) = -50000/10000 = -5
    // fieldCompletionRatio = (18+18)/(2*2*18) ... wait both players have R1+R2 completed
    // holesPlayed = 2*36=72, totalFieldHoles=2*2*18=72, ratio=1.0
    // projected = -5 + (-5 * 1.0) = -10
    assert.equal(result, '-10');
  });

  it('returns null during round 1 when fewer than 75% of holes are played', () => {
    const entries = [
      makeEntry(1, -20000, { R1: { IsCompleted: false, HoleScores: { H1: 3 } } }),
      makeEntry(2, -10000, { R1: { IsCompleted: false, HoleScores: { H1: 4 } } }),
    ];
    // 2 holes played out of 2*18=36 → 5.5% < 75%
    assert.equal(getProjectedCutScore(cutConfig, cut, entries, 1), null);
  });
});
