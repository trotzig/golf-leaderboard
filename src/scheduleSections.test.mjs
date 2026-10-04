import { describe, expect, it } from 'vitest';

import { getWinner, shortDateRange, splitSchedule } from './scheduleSections.mjs';

function comp(id, start, end) {
  return { id, start: new Date(start), end: new Date(end) };
}

const season = [
  comp(1, '2026-05-06T00:00:00Z', '2026-05-08T00:00:00Z'),
  comp(2, '2026-06-03T00:00:00Z', '2026-06-05T00:00:00Z'),
  comp(3, '2026-07-01T00:00:00Z', '2026-07-03T00:00:00Z'),
  comp(4, '2026-08-05T00:00:00Z', '2026-08-07T00:00:00Z'),
  comp(5, '2026-09-09T00:00:00Z', '2026-09-11T00:00:00Z'),
];

function ids(list) {
  return list.map(c => c.id);
}

describe('splitSchedule', () => {
  it('features the ongoing event and sorts the rest latest first', () => {
    const res = splitSchedule(season, new Date('2026-07-02T12:00:00Z'));
    expect(ids(res.upcoming)).toEqual([5, 4]);
    expect(ids(res.current)).toEqual([3]);
    expect(res.next).toBe(null);
    expect(ids(res.past)).toEqual([2, 1]);
  });

  it('features the next event when nothing is ongoing', () => {
    const res = splitSchedule(season, new Date('2026-07-20T12:00:00Z'));
    expect(ids(res.upcoming)).toEqual([5]);
    expect(res.current).toEqual([]);
    expect(res.next.id).toBe(4);
    expect(ids(res.past)).toEqual([3, 2, 1]);
  });

  it('keeps an event current through its final day and the day after', () => {
    const finalDay = splitSchedule(season, new Date('2026-07-03T15:00:00Z'));
    expect(ids(finalDay.current)).toEqual([3]);
    const dayAfter = splitSchedule(season, new Date('2026-07-04T15:00:00Z'));
    expect(dayAfter.current).toEqual([]);
    expect(ids(dayAfter.past)).toEqual([3, 2, 1]);
  });

  it('features every event that is ongoing at the same time', () => {
    const res = splitSchedule(
      [...season, comp(6, '2026-07-02T00:00:00Z', '2026-07-04T00:00:00Z')],
      new Date('2026-07-02T12:00:00Z'),
    );
    expect(ids(res.current)).toEqual([3, 6]);
  });

  it('never features a month-long umbrella entry', () => {
    const series = comp(7, '2026-06-20T00:00:00Z', '2026-09-11T00:00:00Z');
    const during = splitSchedule(
      [...season, series],
      new Date('2026-07-02T12:00:00Z'),
    );
    expect(ids(during.current)).toEqual([3]);
    expect(ids(during.upcoming)).toEqual([5, 4, 7]);

    const between = splitSchedule(
      [...season, series],
      new Date('2026-07-20T12:00:00Z'),
    );
    expect(between.current).toEqual([]);
    expect(between.next.id).toBe(4);
    expect(ids(between.upcoming)).toEqual([5, 7]);
  });

  it('has nothing to feature for a finished season', () => {
    const res = splitSchedule(season, new Date('2027-03-01T12:00:00Z'));
    expect(res.upcoming).toEqual([]);
    expect(res.current).toEqual([]);
    expect(res.next).toBe(null);
    expect(ids(res.past)).toEqual([5, 4, 3, 2, 1]);
  });

  it('accepts timestamps', () => {
    const res = splitSchedule(
      season.map(c => ({ ...c, start: +c.start, end: +c.end })),
      new Date('2026-07-02T12:00:00Z').getTime(),
    );
    expect(ids(res.current)).toEqual([3]);
  });
});

describe('shortDateRange', () => {
  it('collapses the month when the event stays within it', () => {
    expect(
      shortDateRange(new Date(2026, 9, 14), new Date(2026, 9, 16)),
    ).toBe('Oct 14–16');
  });

  it('spells out both months when the event crosses into the next', () => {
    expect(shortDateRange(new Date(2026, 8, 30), new Date(2026, 9, 2))).toBe(
      'Sep 30–Oct 2',
    );
  });

  it('shows a single date for one-day events', () => {
    expect(shortDateRange(new Date(2026, 9, 14), new Date(2026, 9, 14))).toBe(
      'Oct 14',
    );
  });
});

describe('getWinner', () => {
  const score = (position, firstName, lastName) => ({
    position,
    scoreText: '-13',
    score: -13,
    player: { firstName, lastName },
  });

  it('finds the player in first place', () => {
    expect(
      getWinner([score('2', 'Bo', 'Ek'), score('1', 'Algot', 'Kleén')]),
    ).toEqual({ names: ['Algot Kleén'], scoreText: '-13', score: -13 });
  });

  it('returns everyone tied for first', () => {
    expect(
      getWinner([score('T1', 'Bo', 'Ek'), score('T1', 'Algot', 'Kleén')]).names,
    ).toEqual(['Bo Ek', 'Algot Kleén']);
  });

  it('returns null when there are no results yet', () => {
    expect(getWinner([])).toBe(null);
    expect(getWinner(undefined)).toBe(null);
    expect(getWinner([score('MC', 'Bo', 'Ek')])).toBe(null);
  });
});
