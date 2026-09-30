// Fictional, deterministic data for stories. Nothing here comes from GolfBox:
// players, clubs, venues and results are all made up. (Reports stories use
// the real reports in src/reports.) Objects that mimic
// GolfBox responses only copy the shape the components read.

import generateSlug from '../generateSlug.mjs';

// Small seeded PRNG so every build renders the same data.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const FIRST_NAMES = [
  'Axel', 'Oskar', 'Viktor', 'Emil', 'Anton', 'Linus', 'Casper', 'Jonas',
  'Mikkel', 'Rasmus', 'Henrik', 'Mathias', 'Eero', 'Aleksi', 'Sindre',
  'Magnus', 'Filip', 'Hugo', 'Elias', 'Theo', 'Ludvig', 'Nils', 'Kasper',
  'Tobias', 'Sander', 'Joel', 'Albin', 'Valter', 'Otto', 'Gustav',
];

const LAST_NAMES = [
  'Ekvall', 'Lindmark', 'Brandt', 'Sjöholm', 'Rydén', 'Holt', 'Nyqvist',
  'Stenberg', 'Dahlgaard', 'Voss', 'Kallio', 'Aaltonen', 'Berge', 'Fjeld',
  'Kvist', 'Norlén', 'Almgren', 'Hedberg', 'Lund', 'Østby', 'Wikander',
  'Strand', 'Mård', 'Engelin', 'Toivonen', 'Skov', 'Borg', 'Frisk',
  'Hagelin', 'Ståhl',
];

const CLUBS = [
  ['Björkvik Golfklubb', 'SE'],
  ['Sjöudden GK', 'SE'],
  ['Granbacka Golf', 'SE'],
  ['Lindö Strand GK', 'SE'],
  ['Havnevig Golf Klub', 'DK'],
  ['Egeskov Park Golf', 'DK'],
  ['Fjordvik Golfklubb', 'NO'],
  ['Tallholmen Golf', 'FI'],
  ['Stormyra Golfklubb', 'SE'],
  ['Skogsberga GK', 'SE'],
];

function makePlayer(i) {
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  const [clubName, nationality] = CLUBS[i % CLUBS.length];
  return {
    id: `mock-${String(i + 1).padStart(3, '0')}`,
    slug: generateSlug({ firstName, lastName }),
    firstName,
    lastName,
    clubName,
    nationality,
    oomPosition: String(i + 1),
  };
}

export const players = Array.from({ length: 30 }, (_, i) => makePlayer(i));

const CUTTER_BUCK_TOUR = 13350;
const ECCO_TOUR = 13360;

const EVENTS = [
  ['Winter Series Dunes', 'Costa Brava Golf Resort', '02-14', ECCO_TOUR],
  ['Winter Series Pines', 'Costa Brava Golf Resort', '02-18', ECCO_TOUR],
  ['Spring Open', 'Sjöudden Golf & Country Club', '04-22', CUTTER_BUCK_TOUR],
  ['Coastal Classic', 'Havnevig Golf Klub', '05-06', ECCO_TOUR],
  ['Midnight Sun Open', 'Fjordvik Golfklubb', '05-20', CUTTER_BUCK_TOUR],
  ['Lakeside Championship', 'Björkvik Golfklubb', '06-03', CUTTER_BUCK_TOUR],
  ['Archipelago Pro-Am', 'Lindö Strand GK', '06-17', CUTTER_BUCK_TOUR],
  ['Nordic Links Trophy', 'Egeskov Park Golf', '07-01', ECCO_TOUR],
  ['Forest Masters', 'Skogsberga GK', '07-15', CUTTER_BUCK_TOUR],
  ['Harbour Open', 'Tallholmen Golf', '08-05', CUTTER_BUCK_TOUR],
  ['Highland Challenge', 'Stormyra Golfklubb', '08-19', CUTTER_BUCK_TOUR],
  ['Autumn Championship', 'Granbacka Golf', '09-09', CUTTER_BUCK_TOUR],
  ['Tour Final', 'Björkvik Golfklubb', '09-23', CUTTER_BUCK_TOUR],
];

function makeCompetitions(year) {
  return EVENTS.map(([name, venue, date, category], i) => {
    const start = new Date(`${year}-${date}T00:00:00`);
    const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
    return {
      id: year * 100 + i,
      name,
      venue,
      slug: `${generateSlug({ firstName: name, lastName: '' })}-${year}`,
      start: start.getTime(),
      end: end.getTime(),
      categories: [category],
    };
  });
}

export const competitions2026 = makeCompetitions(2026);
export const competitions2025 = makeCompetitions(2025);

// Mimics the GolfBox order of merit response.
export const orderOfMerit = (() => {
  const random = createRandom(1);
  const Entries = {};
  let points = 70000;
  players.forEach((player, i) => {
    const Results = {};
    competitions2026.forEach(competition => {
      const played = random() > 0.2;
      const position = Math.max(1, Math.round(random() * 40 * (i / 30 + 0.3)));
      Results[`R${competition.id}`] = {
        CompetitionID: competition.id,
        Position: played ? (random() > 0.6 ? `T${position}` : `${position}`) : '',
        Result: played ? 1000 : 0,
      };
    });
    points -= 1000 + Math.round(random() * 2500);
    Entries[`E${player.id}`] = {
      MemberID: player.id,
      FirstName: player.firstName,
      LastName: player.lastName,
      ClubName: player.clubName,
      Nationality: player.nationality,
      Position: player.oomPosition,
      CalculatedResult: points,
      Results,
    };
  });
  return {
    OrderOfMeritData: { Name: 'Road to the Final 2026' },
    Entries,
  };
})();

// Player page data (the shape pages/[id].js passes as `player`).
export const playerWithResults = (() => {
  const random = createRandom(2);
  const player = players[0];
  const competitionScore = [];
  for (const competitions of [competitions2026, competitions2025]) {
    for (const competition of competitions) {
      if (competition.start > new Date('2026-09-30').getTime()) continue;
      const toPar = Math.round(random() * 18) - 13;
      const position = Math.max(1, Math.round(random() * 30));
      competitionScore.push({
        position: toPar > 2 ? 'CUT' : `${position}`,
        playerId: player.id,
        competitionId: competition.id,
        scoreText: toPar === 0 ? 'Par' : toPar > 0 ? `+${toPar}` : `${toPar}`,
        score: toPar * 10000,
        competition: {
          id: competition.id,
          name: competition.name,
          venue: competition.venue,
          start: new Date(competition.start).toISOString(),
          slug: competition.slug,
        },
      });
    }
  }
  competitionScore.sort(
    (a, b) => new Date(b.competition.start) - new Date(a.competition.start),
  );
  return { ...player, competitionScore };
})();

const COURSES = [
  { CourseID: 1, CssName: 'course-1', Name: 'Lake Course' },
  { CourseID: 2, CssName: 'course-2', Name: 'Forest Course' },
];

// Mimics the GolfBox tee times response for a three-round event.
export const teeTimes = (() => {
  const Rounds = {};
  for (let round = 1; round <= 3; round++) {
    const StartLists = {};
    COURSES.forEach((course, courseIndex) => {
      const Entries = [];
      for (let match = 0; match < 5; match++) {
        const minutes = 8 * 60 + match * 10;
        const time = `20260909T${String(Math.floor(minutes / 60)).padStart(
          2,
          '0',
        )}${String(minutes % 60).padStart(2, '0')}00`;
        for (let slot = 0; slot < 3; slot++) {
          const player =
            players[(courseIndex * 15 + match * 3 + slot + round * 4) % 30];
          Entries.push({
            MatchNo: courseIndex * 10 + match + 1,
            StartTime: time,
            Hole: courseIndex === 0 ? 1 : 10,
            CourseName: course.Name,
            MemberID: player.id,
            FirstName: player.firstName,
            LastName: player.lastName,
            ClubName: player.clubName,
          });
        }
      }
      StartLists[`S${courseIndex}`] = { Entries };
    });
    Rounds[`R${round}`] = { Number: round, Name: `Round ${round}`, StartLists };
  }
  return {
    ActiveRoundNumber: 2,
    Rounds,
    CompetitionData: { CourseColours: COURSES },
    CourseColours: Object.fromEntries(
      COURSES.map(c => [c.Name.toLowerCase(), c]),
    ),
  };
})();

const PARS = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5];

function makeRound(random, number, course) {
  const Holes = {};
  const HoleScores = {};
  PARS.forEach((par, i) => {
    const r = random();
    const value = r < 0.05 ? par - 2 : r < 0.3 ? par - 1 : r < 0.85 ? par : par + 1;
    Holes[`H${i + 1}`] = { Number: i + 1 };
    HoleScores[`H${i + 1}`] = {
      Par: par,
      Score: { Text: `${value}`, Value: value },
    };
  });
  return {
    Number: number,
    StartDateTime: `2026090${6 + number}T0${7 + number}0000`,
    CourseRefID: course.CourseID,
    CourseName: course.Name,
    Holes,
    HoleScores,
  };
}

// Mimics a GolfBox leaderboard entry, for the player dialog.
export const leaderboardEntry = (() => {
  const random = createRandom(3);
  const player = players[4];
  return {
    MemberID: player.id,
    FirstName: player.firstName,
    LastName: player.lastName,
    ClubName: player.clubName,
    Nationality: player.nationality,
    Position: { Calculated: '1' },
    ResultSum: { ToParText: '-9', ToParValue: -90000 },
    Rounds: {
      R1: makeRound(random, 1, COURSES[0]),
      R2: makeRound(random, 2, COURSES[1]),
    },
  };
})();

export const leaderboardData = {
  CourseColours: Object.fromEntries(
    COURSES.map(c => [c.Name.toLowerCase(), c]),
  ),
};
