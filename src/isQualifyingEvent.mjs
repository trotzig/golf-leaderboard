// Q-School is qualifying for next season's tour, not a tour event. GolfBox has
// no flag or category for it (see docs/golfbox-api.md), so go by the name.
export default function isQualifyingEvent(competition) {
  return /q-?\s?school/i.test(competition.name || '');
}
