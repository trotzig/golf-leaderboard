#!/usr/bin/env node

import crypto from 'crypto';
import nodeFetch from 'node-fetch';

import prisma from '../src/prisma.mjs';
import fetchCompetitions from './utils/fetchCompetitions.mjs';
import generateSlug from '../src/generateSlug.mjs';
import parseJson from './utils/parseJson.mjs';

async function fetchPlayers(competition) {
  const competitionId = competition.id;
  const res = await nodeFetch(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch players for comp ${competitionId}`,
      res.status,
      await res.text(),
    );
  }
  const json = parseJson(await res.text());

  // Piggy-back on the call to get players and add some data to the competition
  // object.
  competition.venue = json.CompetitionData.Venue.Name;

  //console.log(json);
  //console.log('classes', json.Classes);
  const result = [];
  for (const clazz of json.Classes ? Object.values(json.Classes) : []) {
    if (clazz.Leaderboard && clazz.Leaderboard.Entries) {
      const entries = Object.values(clazz.Leaderboard.Entries);
      for (const entry of entries) {
        const player = {
          firstName: entry.FirstName.trim(),
          lastName: entry.LastName.trim(),
          id: entry.MemberID.trim(),
          clubName: entry.ClubName.trim(),
        };
        player.slug = generateSlug(player);
        if (competition.end.getTime() + 24 * 60 * 60 * 1000 < Date.now()) {
          player.competitions = [
            {
              competitionId: json.CompetitionData.Id,
              position: entry.Position.Calculated,
              scoreText: entry.ScoringToPar.ToParText,
              score: entry.ScoringToPar.ToParValue,
            },
          ];
        }
        result.push(player);
      }
    }
  }
  return result;
}

async function fetchAllPlayers(competitions) {
  const allPlayers = {};
  const allSlugs = {};
  for (const comp of competitions) {
    console.log(`Fetching players for competition ${comp.name}...`);
    const players = await fetchPlayers(comp);
    console.log(`${players.length} found`);
    for (const player of players) {
      const entry = allPlayers[player.id];
      if (!entry) {
        allPlayers[player.id] = player;
      } else {
        entry.competitions.unshift(...(player.competitions || []));
      }
    }
  }
  const result = Object.values(allPlayers);
  const slugsIndex = {};
  for (const player of result) {
    if (slugsIndex[player.slug]) {
      console.warn(
        `Found non-unique slug "${player.slug}" for id ${
          player.id
        } belonging to ${slugsIndex[player.slug].id}. Will use random suffix.`,
      );
      player.slug = `${player.slug}-${crypto
        .createHash('md5')
        .update(player.id)
        .digest('hex')
        .slice(0, 3)}`;
    }
    slugsIndex[player.slug] = player;
  }
  return result;
}

async function fillOOM(players) {
  const res = await nodeFetch(
    'https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/1/language/2057/OrderOfMeritID/157709/',
  );
  if (!res.ok) {
    throw new Error('Failed to fetch oom', res.status, await res.text());
  }
  const json = parseJson(await res.text());
  const entries = Object.values(json.Entries);
  const index = {};
  for (const entry of entries) {
    index[entry.MemberID] = entry.Position;
  }
  for (const player of players) {
    player.oomPosition = index[player.id] || '-';
  }
}

async function main() {
  const competitions = await fetchCompetitions();
  const players = await fetchAllPlayers(competitions);
  await fillOOM(players);

  const fileName = '.staticData.json';
  const compRes = await prisma.competition.createMany({
    data: competitions,
    skipDuplicates: true,
  });
  console.log(`Created ${compRes.count} competititons`);

  const playersData = [];
  const compScores = [];
  for (const p of players) {
    const copy = { ...p };
    compScores.push(
      ...(p.competitions || []).map(c => ({ ...c, playerId: p.id })),
    );
    delete copy.competitions;
    playersData.push(copy);
  }

  const playersRes = await prisma.player.createMany({
    data: playersData,
    skipDuplicates: true,
  });
  console.log(`Created ${playersRes.count} users`);

  const scoresRes = await prisma.playerCompetitionScore.createMany({
    data: compScores,
    skipDuplicates: true,
  });
  console.log(`Created ${scoresRes.count} scores`);

  const allPlayers = await prisma.player.findMany();
  for (const player of allPlayers) {
    const newPlayer = playersData.find(p => p.id === player.id);
    if (!newPlayer) continue;
    if (
      newPlayer.oomPosition !== player.oomPosition ||
      newPlayer.firstName !== player.firstName ||
      newPlayer.lastName !== player.lastName ||
      newPlayer.clubName !== player.clubName ||
      newPlayer.slug !== player.slug
    ) {
      await prisma.player.update({
        where: { id: player.id },
        data: { ...newPlayer, updatedAt: new Date() },
      });
      console.log(
        `Updated ${newPlayer.firstName} ${newPlayer.lastName} with id ${newPlayer.id}`,
      );
    }
  }

  const allCompetitions = await prisma.competition.findMany();
  for (const competition of allCompetitions) {
    const newCompetition = competitions.find(c => c.id === competition.id);
    if (!newCompetition) continue;
    if (
      newCompetition.name !== competition.name ||
      newCompetition.venue !== competition.venue ||
      newCompetition.start.getTime() !== competition.start.getTime() ||
      newCompetition.end.getTime() !== competition.end.getTime()
    ) {
      await prisma.competition.update({
        where: { id: competition.id },
        data: { ...newCompetition, updatedAt: new Date() },
      });
      console.log(
        `Updated ${newCompetition.name} with id ${newCompetition.id}`,
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
