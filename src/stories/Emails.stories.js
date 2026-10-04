import React, { useEffect, useRef, useState } from 'react';

import emailTemplates from '../emails/emailTemplates.mjs';
import { renderEmail } from '../emails/renderEmail.mjs';

// Production emails load the icon from the live site; stories use the copy
// that's bundled with Storybook.
const ICON_URL = /https?:\/\/[^"]+\/app-icon-192\.png/g;

// Renders an email the way a mail client would: as its own HTML document.
function EmailFrame({ element }) {
  const ref = useRef(null);
  const [html, setHtml] = useState(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    renderEmail(element).then(rendered => {
      setHtml(rendered.html.replace(ICON_URL, 'app-icon-192.png'));
    });
  }, [element]);

  if (!html) {
    return null;
  }

  return (
    <iframe
      ref={ref}
      srcDoc={html}
      onLoad={() =>
        setHeight(ref.current.contentDocument.documentElement.scrollHeight)
      }
      title="email"
      style={{ width: '100%', height, border: 0, display: 'block' }}
    />
  );
}

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
