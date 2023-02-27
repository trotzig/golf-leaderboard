import { getYear } from 'date-fns';

export default function generateCompetitionSlug(comp) {
  const name = comp.name || comp.Name;
  const year = getYear(comp.start || comp.StartDate);
  const slug = name
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
