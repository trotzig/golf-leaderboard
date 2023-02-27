export default function generateCompetitionSlug(comp) {
  const name = comp.name || comp.Name;
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[åäæ]/g, 'a')
    .replace(/[öø]/g, 'o')
    .replace(/é/, 'e')
    .replace(/[^a-z-]/g, '');
}
