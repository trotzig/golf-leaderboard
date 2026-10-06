import { afterEach, describe, expect, it } from 'vitest';
import { format } from 'date-fns';

import calendarDate from './calendarDate.mjs';
import competitionDateString from './competitionDateString.js';

const originalTZ = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTZ;
});

describe.each(['America/Los_Angeles', 'Europe/Stockholm', 'Asia/Tokyo'])(
  'in %s',
  tz => {
    it('keeps the calendar day of a date stored as midnight UTC', () => {
      process.env.TZ = tz;
      const start = new Date('2026-10-06T00:00:00Z');
      expect(format(calendarDate(start), 'EEE MMMM d yyyy')).toBe(
        'Tue October 6 2026',
      );
    });

    it('shows the competition dates of the venue', () => {
      process.env.TZ = tz;
      const competition = {
        start: new Date('2026-10-06T00:00:00Z'),
        end: new Date('2026-10-08T00:00:00Z'),
      };
      expect(
        competitionDateString(competition, new Date('2026-10-03T12:00:00Z')),
      ).toBe('October 6—8 — Starts in 3 days');
      expect(
        competitionDateString(competition, new Date('2026-10-06T00:36:00Z')),
      ).toBe('October 6—8 — Round 1 of 3');
    });
  },
);
