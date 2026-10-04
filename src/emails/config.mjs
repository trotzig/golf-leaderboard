const { BASE_URL, NEXT_PUBLIC_TITLE } = process.env;

export const siteTitle = NEXT_PUBLIC_TITLE || 'Nordic Golf Tour';
// Links in emails must be absolute, so ignore a BASE_URL that isn't (Vitest
// sets it to `/`).
export const baseUrl = /^https?:\/\//.test(BASE_URL || '')
  ? BASE_URL
  : 'https://nordicgolftour.app';
