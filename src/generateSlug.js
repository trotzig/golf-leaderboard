export default function generateSlug(entry) {
  const firstName = entry.firstName || entry.FirstName;
  const lastName = entry.lastName || entry.LastName;
  return [firstName, lastName]
    .join(' ')
    .toLowerCase()
    .replaceAll('(a)', '')
    .replaceAll(/\s+/g, '-')
    .replaceAll('å', 'a')
    .replaceAll('ä', 'a')
    .replaceAll('ö', 'o')
    .replaceAll('ø', 'o')
    .replaceAll('æ', 'a')
    .replaceAll('é', 'e')
    .replaceAll(/[^a-z-]/g, '');
}
