#!/usr/bin/env node

import nodeFetch from 'node-fetch';

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
  const subscribers = await prisma.favorite.findMany({ where: { playerId } });
  for (const subscriber of subscribers) {
    const account = await prisma.account.findUnique({
      where: { id: subscriber.accountId },
    });

    const resultNotified = await prisma.resultNotified.findUnique({
      where: {
        accountId_roundNumber_competitionId_playerId: {
          playerId,
          accountId: account.id,
          roundNumber,
          competitionId,
        },
      },
    });

    if (resultNotified) {
      continue;
    }

    const text = `
${firstName} ${lastName} has position ${position} in the field after finishing
round ${roundNumber} at ${scoreToPar}.

${BASE_URL}/competitions/${competitionId}?finished=1

-------------------
This email was sent via nordicgolftour.app. To stop getting these emails,
unsubscribe using this link: ${BASE_URL}/unsubscribe
    `.trim();
    console.log('About to send this in an email\n\n', text);
    // await sendMail({
    //   subject: `${firstName} ${lastName} finished round ${roundNumber} at ${scoreToPar}`,
    //   text,
    //   to: account.email,
    // });
  }
}

async function main() {
  const competitions = await fetchCompetitions();
  for (const competition of competitions) {
    const results = await fetchResults(competition);
    for (const result of results) {
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