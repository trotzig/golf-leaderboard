// GolfBox CustomerId 1 ("Nordic Golf League") bundles several men's pro tours.
// Each competition carries a `Categories` array that identifies which tour it
// belongs to. This maps the distinguishing category IDs to a tour name so the
// origin tour can be shown alongside the competition.
const TOUR_BY_CATEGORY = new Map([
  [13350, 'Cutter & Buck Tour'],
  [13360, 'ECCO Tour'],
]);

export default function getCompetitionTour(categories) {
  if (!Array.isArray(categories)) {
    return null;
  }
  for (const category of categories) {
    const tour = TOUR_BY_CATEGORY.get(category);
    if (tour) {
      return tour;
    }
  }
  return null;
}
