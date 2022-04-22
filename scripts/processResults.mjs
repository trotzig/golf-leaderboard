#!/usr/bin/env node

import nodeFetch from 'node-fetch';
import { startOfDay, format } from 'date-fns';

import fetchCompetitions from './utils/fetchCompetitions.mjs';
import generateSlug from '../src/generateSlug.mjs';
import parseJson from './utils/parseJson.mjs';
import prisma from '../src/prisma.mjs';

const { BASE_URL } = process.env;

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
    console.log(entry);
    for (const round of Object.values(entry.Rounds)) {
      if (round.HoleScores['H-TOTAL']) {
        result.push({
          competitionId: competition.id,
          roundNumber: round.Number,
          playerId: entry.MemberID,
          firstName: entry.FirstName.trim(),
          lastName: entry.LastName.trim(),
          score: round.ResultSum.ActualText,
          scoreToPar: round.ResultSum.ToParText,
          position: entry.Position.Calculated,
          slug: generateSlug(entry),
        });
      }
    }
  }
  return result;
}

async function sendResult({
  roundNumber,
  playerId,
  firstName,
  lastName,
  score,
  scoreToPar,
  slug,
  position,
  competitionId,
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

    const text = `
${firstName} ${lastName} has position ${position} in the field after finishing
round ${roundNumber} at ${scoreToPar}.

See the result from ${firstName} and others in the full leaderboard here:
${BASE_URL}/competitions/${competitionId}

-------------------
This email was sent via nordicgolftour.app. To stop getting these emails,
unsubscribe using this link: ${BASE_URL}/api/unsubscribe?token=${account.authToken}
    `.trim();
    console.log(`About to send this in an email to ${account.email}:`);
    console.log(text);
    // await sendMail({
    //   subject: `${firstName} ${lastName} finished round ${roundNumber} at ${scoreToPar}`,
    //   text,
    //   to: account.email,
    // });
    //
  }
}

async function main() {
  const competitions = await fetchCompetitions();
  const today = startOfDay(new Date());
  for (const competition of competitions) {
    if (today < competition.start) {
      console.log(`Competition ${competition.name} hasn't started yet`);
      continue;
    }
    if (today > competition.end) {
      console.log(`Competition ${competition.name} is already over`);
      continue;
    }
    const results = await fetchResults(competition);
    for (const result of results) {
      console.log(`Processing ${competition.name}...`);
      await sendResult(result);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
