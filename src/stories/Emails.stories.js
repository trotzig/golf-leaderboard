import React from 'react';

import emailTemplates from '../emails/emailTemplates.mjs';
import EmailFrame from './EmailFrame.js';

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
};

function playerUpdate(notificationType, overrides) {
  return emailTemplates['player-update']({
    result: { ...result, ...overrides },
    notificationType,
    unsubscribeUrl: 'https://nordicgolftour.app/api/unsubscribe?token=abc',
  }).element;
}

export default {
  title: 'Emails',
  parameters: {
    layout: 'fullscreen',
  },
};

export const SignInCode = () => (
  <EmailFrame element={emailTemplates['sign-in-code']({ code: '4821' }).element} />
);

export const PlayerFinished = () => (
  <EmailFrame element={playerUpdate('finished')} />
);

export const PlayerFinishedOverPar = () => (
  <EmailFrame
    element={playerUpdate('finished', {
      scoreToPar: '+2',
      totalScoreToPar: 'Par',
      position: 'T41',
    })}
  />
);

export const PlayerStarted = () => (
  <EmailFrame
    element={playerUpdate('started', { scoreToPar: '-1', holesPlayed: 3 })}
  />
);

export const PlayerHotStreak = () => (
  <EmailFrame
    element={playerUpdate('hot-streak-7', {
      scoreToPar: '-3',
      holesPlayed: 7,
      position: 'T5',
      scoreLastHole: { scoreText: 'an eagle', hole: '7', toParValue: -2 },
    })}
  />
);
