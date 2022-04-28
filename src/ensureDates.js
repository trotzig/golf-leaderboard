export default function ensureDates(competition) {
  if (!competition.end instanceof Date) {
    competition.end = new Date(competition.end);
  }
  if (!competition.start instanceof Date) {
    competition.start = new Date(competition.start);
  }
}
