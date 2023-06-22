import crypto from 'crypto';
import nodeFetch from 'node-fetch';

import fetchCompetitions from '../scripts/utils/fetchCompetitions.mjs';
import generateSlug from './generateSlug.mjs';
import parseJson from '../scripts/utils/parseJson.mjs';
import prisma from './prisma.mjs';

async function promiseAllInBatches(task, items, batchSize = 10) {
  let position = 0;
  let results = [];
  while (position < items.length) {
    const itemsForBatch = items.slice(position, position + batchSize);
    results.push(...(await Promise.all(itemsForBatch.map(item => task(item)))));
    position += batchSize;
  }
  return results;
}

async function fetchVenue(competition) {
  const res = await nodeFetch(
    `https://scores.golfbox.dk/Handlers/CompetitionHandler/GetCompetition/CompetitionId/${competition.id}/language/2057/`,
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch venue for comp ${competition.name}. Status ${
        res.status
      }. Text: ${await res.text()}`,
    );
  }
  const json = parseJson(await res.text());
  if (!json.CompetitionData.Venue) {
    return undefined;
  }
  return json.CompetitionData.Venue.Name;
}

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
  competition.venue =
    json.CompetitionData.Venue && json.CompetitionData.Venue.Name;

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

async function fetchAllPlayers(competitions, { full }) {
  const allPlayers = {};
  const allSlugs = {};
  const all = await Promise.all(
    competitions.map(async comp => {
      if (
        !full &&
        (comp.end.getTime() + 48 * 60 * 60 * 1000 < Date.now() ||
          comp.start.getTime() - 7 * 24 * 60 * 60 * 1000 > Date.now())
      ) {
        console.log(
          `Performing shallow sync for competition ${comp.name} since full = false`,
        );
        comp.venue = await fetchVenue(comp);
        return [];
      }
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
  console.log('Filling OOM');
  const res = await nodeFetch(
    `https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/${process.env.NEXT_PUBLIC_GOLFBOX_CUSTOMER_ID}/language/2057/OrderOfMeritID/${process.env.NEXT_PUBLIC_GOLFBOX_OOM_ID}/`,
  );
  if (!res.ok) {
    throw new Error('Failed to fetch oom', res.status, await res.text());
  }

  const txt = await res.text();
  const json = parseJson(txt);
  if (!json.Entries) {
    console.warn(`No OOM entries found in response: ${txt}`);
    return;
  }
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

export default async function syncData({ full = true } = {}) {
  const competitions = await fetchCompetitions();
  const players = await fetchAllPlayers(competitions, { full });
  await fillOOM(players);
  dedupeSlugs(players);

  const compRes = await prisma.competition.createMany({
    data: competitions,
    skipDuplicates: true,
  });
  console.log(`Created ${compRes.count} competititons`);

  for (const comp of competitions) {
    try {
      await prisma.competition.update({ data: comp, where: { id: comp.id } });
    } catch (e) {
      console.warn('Failed to update competition', comp);
      console.warn(e);
    }
  }
  console.log(`Updated ${competitions.length} competititons`);

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

  const allPlayerIds = new Set(
    (await prisma.player.findMany({ select: { id: true } })).map(p => p.id),
  );

  const scoresRes = await prisma.playerCompetitionScore.createMany({
    data: compScores.filter(cs => allPlayerIds.has(cs.playerId)),
    skipDuplicates: true,
  });
  console.log(`Created ${scoresRes.count} scores`);

  const allPlayers = await prisma.player.findMany();
  const batchItems = [];
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
      batchItems.push(newPlayer);
    }
  }

  await promiseAllInBatches(async newPlayer => {
    console.log(
      `Updating ${newPlayer.firstName} ${newPlayer.lastName} with id ${newPlayer.id}`,
    );
    try {
      await prisma.player.update({
        where: { id: newPlayer.id },
        data: { ...newPlayer, updatedAt: new Date() },
      });
    } catch (e) {
      if (/failed on.+slug/.test(e.message)) {
        await prisma.player.update({
          where: { slug: newPlayer.slug },
          data: { ...newPlayer, updatedAt: new Date(), id: undefined },
        });
      }
    }
  }, batchItems);

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
        competition,
        newCompetition,
      );
      await prisma.competition.update({
        where: { id: competition.id },
        data: { ...newCompetition, updatedAt: new Date() },
      });
    }
  }
}
