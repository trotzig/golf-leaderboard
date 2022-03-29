#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const nodeFetch = require('node-fetch');

const generateSlug = require('../src/generateSlug');

const { QUICKRUN } = process.env;

function parseJson(raw) {
  return JSON.parse(raw.replace(/:!0/g, ':false').replace(/:!1/g, ':true'));
}

async function fetchCompetitions() {
  const res = await nodeFetch(
    'https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/',
  );
  if (!res.ok) {
    throw new Error('Failed to fetch comps', res.status, await res.text());
  }
  const json = parseJson(await res.text());
  const result = [];
  for (const year of Object.values(json.CompetitionData)) {
    for (const month of Object.values(year.Months)) {
      result.push(
        ...Object.values(month.Entries).map(e => ({ id: e.ID, name: e.Name })),
      );
    }
  }
  if (QUICKRUN) {
    return result.slice(0, 1);
  }
  return result;
}

async function fetchPlayers(competitionId) {
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
          memberId: entry.MemberID.trim(),
          clubName: entry.ClubName.trim(),
        };
        player.slug = generateSlug(player);
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
    const players = await fetchPlayers(comp.id);
    console.log(`${players.length} found`);
    for (const player of players) {
      allPlayers[player.memberId] = player;
    }
  }
  const result = Object.values(allPlayers);
  const slugsIndex = {};
  for (const player of result) {
    if (slugsIndex[player.slug]) {
      console.warn(
        `Found non-unique slug "${player.slug}" for id ${
          player.memberId
        } belonging to ${
          slugsIndex[player.slug].memberId
        }. Will use random suffix.`,
      );
      player.slug = `${player.slug}-${crypto
        .createHash('md5')
        .update(player.memberId)
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
    player.oomPosition = index[player.memberId] || '-';
  }
}

async function main() {
  const competitions = await fetchCompetitions();
  const players = await fetchAllPlayers(competitions);
  await fillOOM(players);
  const fileName = '.staticData.json';
  console.log(`Writing json results to ${fileName}`);
  fs.writeFileSync(fileName, JSON.stringify({ players }));
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
