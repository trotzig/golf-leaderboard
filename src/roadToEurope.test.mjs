import { describe, expect, it } from 'vitest';

import {
  getRaceStatus,
  getRemainingEvents,
  isRoadToEurope,
  parsePosition,
} from './roadToEurope.mjs';

function entry(id, Position, CalculatedResult) {
  return { MemberID: id, Position, CalculatedResult };
}

describe('parsePosition', () => {
  it('handles ties and missing positions', () => {
    expect(parsePosition('3')).toBe(3);
    expect(parsePosition('T12')).toBe(12);
    expect(parsePosition('')).toBe(Infinity);
    expect(parsePosition(undefined)).toBe(Infinity);
  });
});

describe('isRoadToEurope', () => {
  it('matches the ranking name', () => {
    expect(isRoadToEurope('Road to Europe 2026')).toBe(true);
    expect(isRoadToEurope('Some other OOM')).toBe(false);
    expect(isRoadToEurope(undefined)).toBe(false);
  });
});

describe('getRaceStatus', () => {
  const entries = [
    entry('g', '7', 30000),
    entry('a', '1', 60000),
    entry('b', '2', 55000),
    entry('c', '3', 50000),
    entry('d', '4', 45000),
    entry('e', '5', 40000),
    entry('f', '6', 38000),
  ];

  it('splits qualified players from chasers', () => {
    const status = getRaceStatus(entries);
    expect(status.qualified.map(e => e.MemberID)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
    expect(status.chasers.map(e => e.MemberID)).toEqual(['f', 'g']);
    expect(status.lastQualifiedId).toBe('e');
  });

  it('computes the margin and the distance to the line', () => {
    const { statusById } = getRaceStatus(entries);
    expect(statusById.get('e')).toEqual({ qualified: true, margin: 2000 });
    expect(statusById.get('a')).toEqual({ qualified: true, margin: 22000 });
    expect(statusById.get('f')).toEqual({
      qualified: false,
      chaser: true,
      behind: 2000,
    });
    expect(statusById.get('g').behind).toBe(10000);
  });

  it('includes everyone tied for the last spot', () => {
    const status = getRaceStatus([
      ...entries.slice(1, 5),
      entry('e', 'T5', 40000),
      entry('f', 'T5', 40000),
      entry('g', '7', 30000),
    ]);
    expect(status.qualified).toHaveLength(6);
    expect(status.statusById.get('g').behind).toBe(10000);
  });
});

describe('getRemainingEvents', () => {
  it('stops at the final and skips qualifiers', () => {
    const events = [
      { name: 'Road to Europe Final by Sparekassen Danmark', start: 2 },
      { name: 'Destination Gotland Open', start: 1 },
      { name: 'Cutter & Buck Tour Qualifier', start: 3 },
      { name: 'Winter Series 2027', start: 4 },
    ];
    expect(getRemainingEvents(events).map(e => e.name)).toEqual([
      'Destination Gotland Open',
      'Road to Europe Final by Sparekassen Danmark',
    ]);
  });

  it('returns all non-qualifier events when there is no final', () => {
    const events = [
      { name: 'Open A', start: 1 },
      { name: 'Q-School', start: 2 },
    ];
    expect(getRemainingEvents(events).map(e => e.name)).toEqual(['Open A']);
  });
});
