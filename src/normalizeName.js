function normalizeNamePart(part) {
  if (part === '(a)') return part;
  // Leave all-uppercase abbreviations alone
  if (/[A-Z]/.test(part) && part === part.toUpperCase()) return part;
  if (part.includes('-')) {
    return part.split('-').map(normalizeNamePart).join('-');
  }
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export default function normalizeName(s) {
  if (!s) return s;
  // Strip asterisk markers (e.g. "*" denoting non-members) that otherwise
  // show up in the display name and break the generated slug.
  return s
    .replace(/\*/g, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(normalizeNamePart)
    .join(' ');
}
