import { getYear } from 'date-fns';

export default function generateCompetitionSlug(comp) {
  const parts = [comp.name || comp.Name];
  if (process.env.NEXT_PUBLIC_INCLUDE_VENUE_IN_SLUG) {
    parts.push(comp.venue || comp.Venue.Name);
  }
  const year = comp.start
    ? getYear(new Date(comp.start))
    : comp.StartDate.slice(0, 4);
  const slug = parts
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[åäæ]/g, 'a')
    .replace(/[öø]/g, 'o')
    .replace(/é/, 'e')
    .replace(/[^a-z0-9-]/g, '');

  if (/[0-9]{4}$/.test(slug)) {
    // year already part of slug
    return slug;
  }
  return `${slug}-${year}`;
}
