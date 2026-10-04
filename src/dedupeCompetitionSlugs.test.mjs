import { describe, expect, it } from 'vitest';

import dedupeCompetitionSlugs from './dedupeCompetitionSlugs.mjs';

const lastSeason = {
  id: 5191580,
  slug: 'ngl-q-school-final-stage-2026',
  start: new Date('2025-10-07T00:00:00Z'),
};

function comp(overrides) {
  return {
    id: 5844156,
    slug: 'ngl-q-school-final-stage-2026',
    start: new Date('2026-10-06T00:00:00Z'),
    ...overrides,
  };
}

describe('dedupeCompetitionSlugs', () => {
  it('gives a new slug to a competition colliding with another season', () => {
    const [result] = dedupeCompetitionSlugs([comp()], [lastSeason]);
    expect(result.slug).toBe('ngl-q-school-final-stage-2026-5844156');
  });

  it('keeps the slug of the competition that already owns it', () => {
    const [result] = dedupeCompetitionSlugs(
      [comp({ id: lastSeason.id, start: lastSeason.start })],
      [lastSeason],
    );
    expect(result.slug).toBe('ngl-q-school-final-stage-2026');
  });

  it('keeps the slug when the event was recreated in the same season', () => {
    const [result] = dedupeCompetitionSlugs(
      [comp({ start: new Date('2025-10-09T00:00:00Z') })],
      [lastSeason],
    );
    expect(result.slug).toBe('ngl-q-school-final-stage-2026');
  });

  it('keeps the slug when nothing owns it yet', () => {
    const [result] = dedupeCompetitionSlugs([comp()], []);
    expect(result.slug).toBe('ngl-q-school-final-stage-2026');
  });
});
