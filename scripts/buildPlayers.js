#!/usr/bin/env node

const nodeFetch = require('node-fetch');

function parseJson(raw) {
  return JSON.parse(raw.replaceAll(':!0', ':false').replaceAll(':!1', ':true'));
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
        result.push({
          firstName: entry.FirstName,
          lastName: entry.LastName,
          memberId: entry.MemberID,
        });
      }
    }
  }
  return result;
}

async function fetchAllPlayers(competitions) {
  const allPlayers = {};
  for (const comp of competitions) {
    console.log(`Fetching players for competition ${comp.name}...`);
    const players = await fetchPlayers(comp.id);
    console.log(`${players.length} found`);
    for (const player of players) {
      allPlayers[player.memberId] = player;
    }
  }
  return Object.values(allPlayers);
}

async function main() {
  const competitions = await fetchCompetitions();
  const players = await fetchAllPlayers(competitions);
  console.log(players);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
