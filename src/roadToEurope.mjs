// The Road to Europe is the season-long ranking across the Nordic Golf League
// tours (Cutter & Buck Tour, ECCO Tour, ...). The top five players on the
// final ranking earn membership on the next season's Challenge Tour
// (HotelPlanner Tour).
export const CHALLENGE_TOUR_SPOTS = 5;

// Only tease the race on the start page for the run-in of the season.
export const TEASER_MAX_EVENTS_LEFT = 4;

// How many players below the line to show as "in the hunt".
export const CHASERS = 5;

export function isRoadToEurope(name) {
  return /road to europe/i.test(name || '');
}

// GolfBox positions look like "1", "T4" or "" (not ranked).
export function parsePosition(position) {
  const match = /(\d+)/.exec(String(position ?? ''));
  return match ? parseInt(match[1], 10) : Infinity;
}

// Takes order of merit entries (GolfBox shape: Position, CalculatedResult)
// and works out who's inside the Challenge Tour spots and how far the
// chasers are from the line.
export function getRaceStatus(entries, spots = CHALLENGE_TOUR_SPOTS) {
  const sorted = [...entries].sort(
    (a, b) =>
      parsePosition(a.Position) - parsePosition(b.Position) ||
      (b.CalculatedResult || 0) - (a.CalculatedResult || 0),
  );
  const qualified = sorted.filter(e => parsePosition(e.Position) <= spots);
  const outside = sorted.filter(e => parsePosition(e.Position) > spots);
  const linePoints = qualified.length
    ? qualified[qualified.length - 1].CalculatedResult
    : 0;
  const firstOutPoints = outside.length ? outside[0].CalculatedResult : 0;

  const statusById = new Map();
  for (const entry of qualified) {
    statusById.set(entry.MemberID, {
      qualified: true,
      // Points cushion over the first player outside the spots.
      margin: Math.round(entry.CalculatedResult - firstOutPoints),
    });
  }
  outside.forEach((entry, i) => {
    statusById.set(entry.MemberID, {
      qualified: false,
      chaser: i < CHASERS,
      // Points needed to catch the last player inside the spots.
      behind: Math.round(linePoints - entry.CalculatedResult),
    });
  });

  return {
    spots,
    qualified,
    chasers: outside.slice(0, CHASERS),
    lastQualifiedId: qualified.length
      ? qualified[qualified.length - 1].MemberID
      : undefined,
    statusById,
  };
}

// Upcoming events that still count for the Road to Europe: everything up to
// and including the Road to Europe Final, but not qualifying schools for
// next season (which are scheduled after the final).
export function getRemainingEvents(upcomingCompetitions) {
  const sorted = [...upcomingCompetitions]
    .filter(c => !/qualif|q-school|kval/i.test(c.name))
    .sort((a, b) => a.start - b.start);
  const finalIndex = sorted.findIndex(c => /final/i.test(c.name));
  return finalIndex === -1 ? sorted : sorted.slice(0, finalIndex + 1);
}
