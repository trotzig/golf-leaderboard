import { createElement } from 'react';

import fixParValue from '../fixParValue.mjs';
import { CODE_TTL_MS } from '../signIn.mjs';
import { baseUrl, siteTitle } from './config.mjs';
import PlayerUpdateEmail from './templates/PlayerUpdateEmail.jsx';
import SignInCodeEmail from './templates/SignInCodeEmail.jsx';

function fixTotalScore(score) {
  if (score === 'Par') {
    return 'on even par';
  }
  return score;
}

// Subject, heading, body and key stats for each kind of player notification
// (`finished`, `started` or `hot-streak-<hole>`).
function playerUpdateContent(
  {
    roundNumber,
    firstName,
    lastName,
    scoreToPar,
    totalScoreToPar,
    position,
    competitionName,
    holesPlayed,
    scoreLastHole,
  },
  notificationType,
) {
  const name = `${firstName} ${lastName}`;
  const roundScore = fixParValue(scoreToPar);
  const roundStat = { label: `Round ${roundNumber}`, value: roundScore };

  if (notificationType === 'finished') {
    return {
      subject: `${name} finished round ${roundNumber} at ${roundScore}`,
      heading: `${name} finished round ${roundNumber} at ${roundScore}`,
      body: `${name} has position ${position} in the field after finishing round ${roundNumber} at ${roundScore} of ${competitionName}. ${firstName} is ${fixTotalScore(
        totalScoreToPar,
      )} total.`,
      stats: [
        { label: 'Position', value: position },
        roundStat,
        { label: 'Total', value: fixParValue(totalScoreToPar) },
      ],
    };
  }

  const progressStats = [
    roundStat,
    { label: 'Holes played', value: holesPlayed },
    { label: 'Position', value: position },
  ];

  if (notificationType === 'started') {
    return {
      subject: `${name} is ${roundScore} after ${holesPlayed} holes at round ${roundNumber}`,
      heading: `${name} is ${roundScore} after ${holesPlayed} holes`,
      body: `${name} has started playing round ${roundNumber} of ${competitionName}. ${firstName} is ${roundScore} after ${holesPlayed} holes played.`,
      stats: progressStats,
    };
  }

  return {
    subject: `${name} made ${scoreLastHole.scoreText} on hole ${scoreLastHole.hole} at round ${roundNumber}`,
    heading: `${name} made ${scoreLastHole.scoreText} on hole ${scoreLastHole.hole}`,
    body: `${name} just made ${scoreLastHole.scoreText} on hole ${scoreLastHole.hole} of ${competitionName}. ${firstName} is ${roundScore} after ${holesPlayed} holes played.`,
    stats: progressStats,
  };
}

// Each template returns the `subject` and react-email `element` to pass on to
// `sendMail`.
const emailTemplates = {
  'sign-in-code': ({ code }) => ({
    subject: `${code} is your ${siteTitle} sign-in code`,
    element: createElement(SignInCodeEmail, {
      code,
      validHours: CODE_TTL_MS / (60 * 60 * 1000),
    }),
  }),

  // `sponsor` is optional: { name, href, logoSrc, logoBackground, color,
  // headline, pitch, cta }.
  'player-update': ({ result, notificationType, unsubscribeUrl, sponsor }) => {
    const { subject, ...content } = playerUpdateContent(
      result,
      notificationType,
    );
    return {
      subject,
      unsubscribeUrl,
      element: createElement(PlayerUpdateEmail, {
        ...content,
        competitionName: result.competitionName,
        roundNumber: result.roundNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        leaderboardUrl: `${baseUrl}/t/${result.competitionSlug}`,
        playerUrl: `${baseUrl}/${result.slug}`,
        unsubscribeUrl,
        sponsor,
      }),
    };
  },
};

export default emailTemplates;
