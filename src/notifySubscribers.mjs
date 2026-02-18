import { startOfDay } from 'date-fns';

import { sendMail } from './mailgun.mjs';
import fixParValue from './fixParValue.mjs';
import generateSlug from './generateSlug.mjs';
import getCurrentCompetition from './getCurrentCompetition.mjs';
import parseJson from '../scripts/utils/parseJson.mjs';
import prisma from './prisma.mjs';

const { BASE_URL, TEST_COMPETITION_ID, MAILGUN_DOMAIN } = process.env;

function getHole(entry) {
  if (!entry.Rounds) {
    return '-';
  }
  const round = Object.values(entry.Rounds).reverse()[0];
  if (!round) {
    return '-';
  }
  if (!round.HoleScores) {
    return '-';
  }
  const scores = { ...round.HoleScores };
  delete scores['H-TOTAL'];
  delete scores['H-OUT'];
  delete scores['H-IN'];
  const keys = Object.keys(scores);
  if (keys.length === 18) {
    return 'F';
  }
  const h = keys.reverse()[0];
  if (!h) {
    return '-';
  }
  return h.replace('H', '');
}

function getLastHoleScore(holeScores) {
  const scores = { ...holeScores };
  delete scores['H-TOTAL'];
  delete scores['H-OUT'];
  delete scores['H-IN'];

  const holeKeys = Object.keys(scores);
  if (!holeKeys.length) {
    return undefined;
  }
  const lastKey = holeKeys[holeKeys.length - 1];
  // {"Par":4,"Result":{"ToParValue":0.0,"ToParText":"Par","ActualValue":4.0,"ActualText":"4"},"Score":{"Text":"4","Value":4},"IsCounting":!0}
  const {
    Result: { ToParValue: toParValue, ActualValue: actualValue },
  } = scores[lastKey];

  const hole = lastKey.replace('H', '');
  const scoreText =
    actualValue === 1
      ? 'a hole-in-one'
      : toParValue === -3
      ? 'an albatross'
      : toParValue === -2
      ? 'an eagle'
      : toParValue === -1
      ? 'a birdie'
      : toParValue === 0
      ? 'a par'
      : toParValue === 1
      ? 'a bogey'
      : toParValue === 2
      ? 'a double bogey'
      : toParValue === 3
      ? 'a triple bogey'
      : 'other';
  return { toParValue, actualValue, hole, scoreText };
}

async function fetchIsFinished(competition) {
  const res = await fetch(
    `https://scores.golfbox.dk/Handlers/CompetitionHandler/GetCompetition/CompetitionId/${competition.id}/language/2057/`,
  );
  if (!res.ok) {
    return false;
  }
  const json = parseJson(await res.text());
  return json.DefaultAction === 'finalresults';
}

async function fetchResults(competition) {
  const res = await fetch(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch players for comp ${competition.id}`,
      res.status,
      await res.text(),
    );
  }
  const json = parseJson(await res.text());
  const leaderboard = Object.values(json.Classes)[0].Leaderboard;
  const entries = Object.values(leaderboard.Entries);
  const finished = [];
  const started = [];
  const hotStreakers = [];
  const leaderboardEntries = [];
  const allPlayerIds = new Set(
    (await prisma.player.findMany({ select: { id: true } })).map(p => p.id),
  );
  for (const entry of entries) {
    if (!allPlayerIds.has(entry.MemberID)) {
      console.log(
        `Ignoring player with ID ${entry.MemberID} since they have not been synced`,
      );
      continue;
    }
    const hole = getHole(entry);
    leaderboardEntries.push({
      playerId: entry.MemberID,
      competitionId: competition.id,
      positionText: entry.Position.Calculated,
      position: entry.Position.Actual,
      scoreText: entry.ScoringToPar.ToParText,
      score: entry.ScoringToPar.ToParValue,
      hole,
      updatedAt: new Date(),
    });
    if (!entry.Rounds) {
      continue;
    }
    const round = Object.values(entry.Rounds).reverse()[0];
    const len = Object.keys(round.HoleScores).length;
    const attrs = {
      competitionName: competition.name,
      competitionId: competition.id,
      competitionSlug: competition.slug,
      roundNumber: round.Number,
      playerId: entry.MemberID,
      firstName: entry.FirstName.trim(),
      lastName: entry.LastName.trim(),
      score: round.ResultSum.ActualText,
      scoreLastHole: getLastHoleScore(round.HoleScores),
      scoreToPar: round.ResultSum.ToParText,
      totalScoreToPar: entry.ResultSum.ToParText,
      position: entry.Position.Calculated,
      slug: generateSlug(entry),
      holesPlayed: len - 3,
    };
    if (len === 21) {
      finished.push(attrs);
    } else if (len > 5 && len < 8) {
      started.push(attrs);
    }
    if (attrs.scoreLastHole && attrs.scoreLastHole.toParValue < -1) {
      hotStreakers.push(attrs);
    }
  }
  return { finished, started, hotStreakers, leaderboardEntries };
}

function fixTotalScore(score) {
  if (score === 'Par') {
    return 'on even par';
  }
  return score;
}

async function sendEmail(
  {
    roundNumber,
    playerId,
    firstName,
    lastName,
    score,
    scoreToPar,
    totalScoreToPar,
    slug,
    position,
    competitionId,
    competitionName,
    competitionSlug,
    holesPlayed,
    scoreLastHole,
  },
  notificationType,
) {
  const resultNotified = await prisma.resultNotified.findUnique({
    where: {
      roundNumber_competitionId_playerId_notificationType: {
        playerId,
        roundNumber,
        competitionId,
        notificationType,
      },
    },
  });

  if (resultNotified) {
    return;
  }

  // Save a row in the resultNotifieds table so that we don't notify the user
  // again.
  await prisma.resultNotified.create({
    data: {
      playerId,
      roundNumber,
      competitionId,
      notificationType,
    },
  });

  const subscribers = await prisma.favorite.findMany({
    where: { playerId },
    select: { account: true },
  });
  for (const subscriber of subscribers) {
    const { account } = subscriber;
    if (notificationType === 'finished' && !account.sendEmailOnFinished) {
      // user is not subscribed
      continue;
    }
    if (notificationType === 'started' && !account.sendEmailOnStart) {
      // user is not subscribed
      continue;
    }
    if (
      notificationType.startsWith('hot-streak') &&
      !account.sendEmailOnHotStreak
    ) {
      // user is not subscribed
      continue;
    }

    const footer = `
See the result from ${firstName} and others in the full leaderboard here:
${BASE_URL}/t/${competitionSlug}

-------------------
This email was sent via ${MAILGUN_DOMAIN}. To stop getting these emails,
unsubscribe using this link: ${BASE_URL}/api/unsubscribe?token=${account.authToken}
    `.trim();

    const subject =
      notificationType === 'finished'
        ? `${firstName} ${lastName} finished round ${roundNumber} at ${fixParValue(
            scoreToPar,
          )}`
        : notificationType === 'started'
        ? `${firstName} ${lastName} is ${fixParValue(
            scoreToPar,
          )} after ${holesPlayed} holes at round ${roundNumber}`
        : `${firstName} ${lastName} made ${scoreLastHole.scoreText} on hole ${scoreLastHole.hole} at round ${roundNumber}`;

    const text =
      notificationType === 'finished'
        ? `
${firstName} ${lastName} has position ${position} in the field after finishing round ${roundNumber} at ${fixParValue(
            scoreToPar,
          )} of ${competitionName}. ${firstName} is ${fixTotalScore(
            totalScoreToPar,
          )} total.

${footer}
    `.trim()
        : notificationType === 'started'
        ? `
${firstName} ${lastName} has started playing round ${roundNumber} of ${competitionName}. ${firstName} is ${fixParValue(
            scoreToPar,
          )} after ${holesPlayed} holes played.

${footer}
    `.trim()
        : `
${firstName} ${lastName} just made ${scoreLastHole.scoreText} on hole ${
            scoreLastHole.hole
          } of ${competitionName}. ${firstName} is ${fixParValue(
            scoreToPar,
          )} after ${holesPlayed} holes played.

${footer}
    `.trim();
    // console.log(`About to send this in an email to ${account.email}:`);
    // console.log({ subject, text });
    await sendMail({
      subject,
      text,
      to: account.email,
    });
  }
}

async function upsertLeaderboard(competitionId, entries) {
  await prisma.$transaction([
    prisma.leaderboardEntry.deleteMany({ where: { competitionId } }),
    prisma.leaderboardEntry.createMany({
      data: entries,
    }),
  ]);
}

export default async function notifySubscribers() {
  const start = Date.now();
  const competitions = [await getCurrentCompetition()];
  const today = startOfDay(new Date());
  for (const competition of competitions) {
    if (TEST_COMPETITION_ID !== `${competition.id}`) {
      if (today.getTime() + 60 * 60 * 1000 < competition.start) {
        // console.log(
        //   `Competition ${competition.name} (${competition.id}) hasn't started yet`,
        // );
        continue;
      }
      if (today.getTime() - 24 * 60 * 60 * 1000 > competition.end) {
        // console.log(
        //   `Competition ${competition.name} (${competition.id}) is already over`,
        // );
        continue;
      }
    }
    console.log(`Processing ${competition.name}...`);
    const { finished, started, hotStreakers, leaderboardEntries } =
      await fetchResults(competition);
    await upsertLeaderboard(competition.id, leaderboardEntries);
    const isFinished = await fetchIsFinished(competition);
    if (isFinished) {
      await prisma.competition.update({
        where: { id: competition.id },
        data: { finished: true },
      });
    }
    for (const result of started) {
      await sendEmail(result, 'started');
    }
    for (const result of finished) {
      await sendEmail(result, 'finished');
    }
    for (const result of hotStreakers) {
      await sendEmail(result, `hot-streak-${result.scoreLastHole.hole}`);
    }
  }
  const end = Date.now();

  console.log(`notifySubscribers done. Took ${end - start} ms`);
}
