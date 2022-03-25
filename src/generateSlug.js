module.exports = function generateSlug(entry) {
  const firstName = entry.firstName || entry.FirstName;
  const lastName = entry.lastName || entry.LastName;
  return [firstName, lastName]
    .join(' ')
    .toLowerCase()
    .replace(/\(a\)/g, '')
    .replace(/\s+/g, '-')
    .replace(/[åäæ]/g, 'a')
    .replace(/[öø]/g, 'o')
    .replace(/é/, 'e')
    .replace(/[^a-z-]/g, '');
};
