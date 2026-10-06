import { describe, expect, it } from 'vitest';

import ogCompetitionCard from './ogCompetitionCard.mjs';

const competition = {
  name: 'Folksam Championship',
  venue: 'Barsebäck Golf & Resort',
  start: new Date(Date.UTC(2026, 8, 23)),
  end: new Date(Date.UTC(2026, 8, 25)),
  categories: [13350, 13361],
};

describe('ogCompetitionCard', () => {
  it('describes an upcoming tournament', () => {
    expect(ogCompetitionCard(competition)).toEqual({
      title: 'Folksam Championship',
      details: ['Barsebäck Golf & Resort', 'September 23–25, 2026'],
    });
  });

  it('includes the winner when there is one', () => {
    const card = ogCompetitionCard(competition, {
      scoreText: '-13',
      player: { id: '020618-005', firstName: 'Algot', lastName: 'Kleén' },
    });
    expect(card.winner).toEqual({
      playerId: '020618-005',
      name: 'Algot Kleén',
      scoreText: '-13',
    });
  });

  it('spells out both months when the tournament crosses into a new one', () => {
    const card = ogCompetitionCard({
      ...competition,
      start: new Date(Date.UTC(2026, 8, 30)),
      end: new Date(Date.UTC(2026, 9, 2)),
    });
    expect(card.details[1]).toBe('September 30 – October 2, 2026');
  });

  it('shows a single date for one-day events', () => {
    const card = ogCompetitionCard({
      ...competition,
      end: competition.start,
    });
    expect(card.details[1]).toBe('September 23, 2026');
  });

  it('leaves out a missing venue and strips the entry suffix', () => {
    const card = ogCompetitionCard({
      ...competition,
      name: 'Folksam Championship (Entry)',
      venue: null,
    });
    expect(card.title).toBe('Folksam Championship');
    expect(card.details).toEqual(['September 23–25, 2026']);
  });
});
