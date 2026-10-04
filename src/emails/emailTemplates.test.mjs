import { describe, expect, it } from 'vitest';

import emailTemplates from './emailTemplates.mjs';
import { renderEmail } from './renderEmail.mjs';

const result = {
  competitionName: 'Big Green Egg Swedish Matchplay',
  competitionSlug: 'big-green-egg-swedish-matchplay-2026',
  roundNumber: 2,
  firstName: 'Stefan',
  lastName: 'Idstam',
  slug: 'stefan-idstam',
  scoreToPar: '-4',
  totalScoreToPar: '-9',
  position: 'T3',
  holesPlayed: 18,
  scoreLastHole: { scoreText: 'an eagle', hole: '7', toParValue: -2 },
};
const unsubscribeUrl = 'https://nordicgolftour.app/api/unsubscribe?token=abc';

function playerUpdate(notificationType, overrides = {}) {
  return emailTemplates['player-update']({
    result: { ...result, ...overrides },
    notificationType,
    unsubscribeUrl,
  });
}

describe('player-update', () => {
  it('describes a finished round', async () => {
    const email = playerUpdate('finished');
    expect(email.subject).toBe('Stefan Idstam finished round 2 at -4');

    const { html, text } = await renderEmail(email.element);
    expect(text).toContain(
      'Stefan Idstam has position T3 in the field after finishing round 2 at -4 of Big Green Egg Swedish Matchplay. Stefan is -9 total.',
    );
    expect(html).toContain(
      'href="https://nordicgolftour.app/t/big-green-egg-swedish-matchplay-2026"',
    );
    expect(html).toContain('href="https://nordicgolftour.app/stefan-idstam"');
  });

  it('spells out even par', async () => {
    const email = playerUpdate('finished', {
      scoreToPar: 'Par',
      totalScoreToPar: 'Par',
    });
    expect(email.subject).toBe('Stefan Idstam finished round 2 at E');

    const { text } = await renderEmail(email.element);
    expect(text).toContain('Stefan is on even par total.');
  });

  it('describes a started round', async () => {
    const email = playerUpdate('started', { holesPlayed: 3 });
    expect(email.subject).toBe('Stefan Idstam is -4 after 3 holes at round 2');

    const { text } = await renderEmail(email.element);
    expect(text).toContain('Stefan is -4 after 3 holes played.');
  });

  it('describes a hot streak', async () => {
    const email = playerUpdate('hot-streak-7', { holesPlayed: 7 });
    expect(email.subject).toBe('Stefan Idstam made an eagle on hole 7 at round 2');

    const { text } = await renderEmail(email.element);
    expect(text).toContain('Stefan Idstam just made an eagle on hole 7');
  });

  it('links to the unsubscribe page in both parts', async () => {
    const { html, text } = await renderEmail(playerUpdate('finished').element);
    expect(html).toContain(`href="${unsubscribeUrl}"`);
    expect(text).toContain(unsubscribeUrl);
  });
});

describe('sign-in-code', () => {
  it('includes the code and how long it is valid', async () => {
    const email = emailTemplates['sign-in-code']({ code: '4821' });
    expect(email.subject).toBe('4821 is your Nordic Golf Tour sign-in code');

    const { html, text } = await renderEmail(email.element);
    expect(html).toContain('4821');
    expect(text).toContain('4821');
    expect(text).toContain('The code is valid for 2 hours.');
    expect(text).not.toContain('Unsubscribe');
  });
});
