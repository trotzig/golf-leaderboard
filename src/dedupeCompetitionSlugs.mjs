// A competition whose name ends in a year (e.g. "NGL Q-School Final Stage
// 2026") gets a slug without the season appended. GolfBox sometimes adds next
// season's event under the old name before renaming it, which makes the slug
// collide with last season's event. Give the newcomer a slug of its own so
// that it doesn't take over the old competition (and its results).
export default function dedupeCompetitionSlugs(competitions, existing) {
  const ownerBySlug = new Map(existing.map(c => [c.slug, c]));
  for (const comp of competitions) {
    const owner = ownerBySlug.get(comp.slug);
    if (
      owner &&
      owner.id !== comp.id &&
      new Date(owner.start).getUTCFullYear() !== comp.start.getUTCFullYear()
    ) {
      comp.slug = `${comp.slug}-${comp.id}`;
    }
  }
  return competitions;
}
