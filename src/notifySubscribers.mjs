import { startOfDay } from 'date-fns';

import nodeFetch from 'node-fetch';

import { sendMail } from './mailgun.mjs';
import fetchCompetitions from '../scripts/utils/fetchCompetitions.mjs';
import generateSlug from './generateSlug.mjs';
import parseJson from '../scripts/utils/parseJson.mjs';
import prisma from './prisma.mjs';

const { BASE_URL, TEST_COMPETITION_ID } = process.env;

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
  const scores = round.HoleScores;
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

async function fetchResults(competition) {
  const res = await nodeFetch(
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
  const result = [];
  for (const entry of entries) {
    if (entry.Position.Actual < 10) {
      const hole = getHole(entry);
      const attrs = {
        playerId: entry.MemberID,
        competitionId: competition.id,
        positionText: entry.Position.Calculated,
        position: entry.Position.Actual,
        scoreText: entry.ScoringToPar.ToParText,
        score: entry.ScoringToPar.ToParValue,
        hole,
      };
      await prisma.leaderboardEntry.upsert({
        where: {
          competitionId_position: {
            competitionId: competition.id,
            position: entry.Position.Actual,
          },
        },
        update: attrs,
        create: attrs,
      });
    }
    for (const round of Object.values(entry.Rounds)) {
      if (Object.keys(round.HoleScores).length === 21) {
        result.push({
          competitionName: competition.name,
          competitionId: competition.id,
          roundNumber: round.Number,
          playerId: entry.MemberID,
          firstName: entry.FirstName.trim(),
          lastName: entry.LastName.trim(),
          score: round.ResultSum.ActualText,
          scoreToPar: round.ResultSum.ToParText,
          totalScoreToPar: entry.ResultSum.ToParText,
          position: entry.Position.Calculated,
          slug: generateSlug(entry),
        });
      }
    }
  }
  return result;
}

function fixTotalScore(score) {
  if (score === 'Par') {
    return 'on even par';
  }
  return score;
}

async function sendResult({
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
}) {
  const resultNotified = await prisma.resultNotified.findUnique({
    where: {
      roundNumber_competitionId_playerId: {
        playerId,
        roundNumber,
        competitionId,
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
    },
  });

  const subscribers = await prisma.favorite.findMany({ where: { playerId } });
  for (const subscriber of subscribers) {
    const account = await prisma.account.findUnique({
      where: { id: subscriber.accountId },
    });

    if (!account.sendEmailOnFinished) {
      // user is unsubscribed
      continue;
    }

    const subject = `${firstName} ${lastName} finished round ${roundNumber} at ${scoreToPar}`;
    const text = `
${firstName} ${lastName} has position ${position} in the field after finishing round ${roundNumber} at ${scoreToPar} of ${competitionName}. ${firstName} is ${fixTotalScore(
      totalScoreToPar,
    )} total.

See the result from ${firstName} and others in the full leaderboard here:
${BASE_URL}/competitions/${competitionId}

-------------------
This email was sent via nordicgolftour.app. To stop getting these emails,
unsubscribe using this link: ${BASE_URL}/api/unsubscribe?token=${
      account.authToken
    }
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

export default async function notifySubscribers() {
  const competitions = await fetchCompetitions();
  const today = startOfDay(new Date());
  for (const competition of competitions) {
    if (TEST_COMPETITION_ID !== `${competition.id}`) {
      if (today < competition.start) {
        console.log(
          `Competition ${competition.name} (${competition.id}) hasn't started yet`,
        );
        continue;
      }
      if (today.getTime() - 24 * 60 * 60 * 1000 > competition.end.getTime()) {
        console.log(
          `Competition ${competition.name} (${competition.id}) is already over`,
        );
        continue;
      }
    }
    console.log(`Processing ${competition.name}...`);
    const results = await fetchResults(competition);
    for (const result of results) {
      await sendResult(result);
    }
  }
}
