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
  return s.trim().split(' ').filter(Boolean).map(normalizeNamePart).join(' ');
}
