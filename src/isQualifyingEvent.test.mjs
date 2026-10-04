import { describe, expect, it } from 'vitest';

import isQualifyingEvent from './isQualifyingEvent.mjs';

describe('isQualifyingEvent', () => {
  it('matches Q-School events', () => {
    expect(isQualifyingEvent({ name: 'NGL Q-School Final Stage 2027' })).toBe(
      true,
    );
    expect(isQualifyingEvent({ name: 'NGL QSchool First Stage' })).toBe(true);
    expect(isQualifyingEvent({ name: 'q school final' })).toBe(true);
  });

  it('does not match tour events', () => {
    expect(isQualifyingEvent({ name: 'FootJoy Skåne Challenge' })).toBe(false);
    expect(isQualifyingEvent({ name: 'Road to Europe Final' })).toBe(false);
    expect(isQualifyingEvent({})).toBe(false);
  });
});
