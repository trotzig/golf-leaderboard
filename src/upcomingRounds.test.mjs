import { describe, expect, it } from 'vitest';
import { withoutLaterUpcomingRounds } from './upcomingRounds.mjs';

const isNotStarted = round => !round.started;

describe('withoutLaterUpcomingRounds', () => {
  it('keeps played rounds and only the next upcoming one', () => {
    const rounds = [
      { id: 'R1', started: true },
      { id: 'R2', started: false },
      { id: 'R3', started: false },
    ];
    expect(
      withoutLaterUpcomingRounds(rounds, isNotStarted).map(r => r.id),
    ).toEqual(['R1', 'R2']);
  });

  it('keeps everything when all rounds have started', () => {
    const rounds = [
      { id: 'R1', started: true },
      { id: 'R2', started: true },
    ];
    expect(withoutLaterUpcomingRounds(rounds, isNotStarted)).toEqual(rounds);
  });

  it('keeps the first round when nothing has started', () => {
    const rounds = [
      { id: 'R1', started: false },
      { id: 'R2', started: false },
    ];
    expect(
      withoutLaterUpcomingRounds(rounds, isNotStarted).map(r => r.id),
    ).toEqual(['R1']);
  });
});
