import crypto from 'crypto';
import nodeFetch from 'node-fetch';

import prisma from './prisma.mjs';
import fetchCompetitions from '../scripts/utils/fetchCompetitions.mjs';
import generateSlug from './generateSlug.mjs';
import parseJson from '../scripts/utils/parseJson.mjs';

async function fetchPlayersFromEntriesList(competition) {
  const res = await nodeFetch(
    `https://scores.golfbox.dk/Handlers/PlayersHandler/GetPlayers/CompetitionId/${competition.id}/language/2057/`,
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch players for comp ${competition.name}. Status ${
        res.status
      }. Text: ${await res.text()}`,
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
    if (clazz.Entries) {
      const entries = Object.values(clazz.Entries);
      for (const entry of entries) {
        if (entry.PlayerStatus === 1) {
          const player = {
            firstName: entry.FirstName.trim(),
            lastName: entry.LastName.trim(),
            id: entry.MemberID.trim(),
            clubName: entry.ClubName.trim(),
          };
          player.slug = generateSlug(player);
          player.competitions = [];
          result.push(player);
        }
      }
    }
  }
  return result;
}
async function fetchPlayers(competition) {
  const now = Date.now();
  if (
    competition.start.getTime() > now &&
    competition.start.getTime() < now + 5 * 24 * 60 * 60 * 1000
  ) {
    console.log(
      `Fetching entries list for competition ${competition.name} since it hasn't started yet`,
    );
    return fetchPlayersFromEntriesList(competition);
  }
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
        } else {
          player.competitions = [];
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
  const all = await Promise.all(
    competitions.map(async comp => {
      console.log(`Fetching players for competition ${comp.name}...`);
      const players = await fetchPlayers(comp);
      console.log(`${comp.name} has ${players.length} players`);
      return players;
    }),
  );

  for (const players of all) {
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
    index[entry.MemberID] = {
      position: entry.Position,
      actualPosition: entry.ActualPosition,
    };
  }
  for (const player of players) {
    const pos = index[player.id];
    if (!pos) {
      player.oomPosition = '-';
      player.oomActualPosition = 999999;
    } else {
      player.oomPosition = pos.position;
      player.oomActualPosition = pos.actualPosition;
    }
  }
}
function dedupeSlugs(players) {
  // Sort players by oom position. This will make slugs that need randomness
  // belong to less important player entries.
  players.sort((a, b) => {
    const oomDiff = a.oomActualPosition - b.oomActualPosition;
    if (oomDiff !== 0) {
      return oomDiff;
    }
    return b.id - a.id;
  });
  const slugsIndex = {};
  for (const player of players) {
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
}

export default async function syncData() {
  const competitions = await fetchCompetitions();
  const players = await fetchAllPlayers(competitions);
  await fillOOM(players);
  dedupeSlugs(players);

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
    delete copy.oomActualPosition;
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
      console.log(
        `Updating ${newPlayer.firstName} ${newPlayer.lastName} with id ${newPlayer.id}`,
      );
      await prisma.player.update({
        where: { id: player.id },
        data: { ...newPlayer, updatedAt: new Date() },
      });
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
      console.log(
        `Updating ${newCompetition.name} with id ${newCompetition.id}`,
      );
      await prisma.competition.update({
        where: { id: competition.id },
        data: { ...newCompetition, updatedAt: new Date() },
      });
    }
  }
}
