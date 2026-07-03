// Configuration for the Kevinge Foursome & Fourball one-off site.

// This year's tournament (GolfBox competition ID). Hard-coded so the site
// always tracks the current edition regardless of environment configuration.
export const KFF_COMPETITION_ID = 5403645;

// Slug for this year's competition; the root URL redirects here.
export const KFF_CURRENT_SLUG =
  'kevinge-foursome--fourball-stockholms-golfklubb-2026';

// All editions, newest first. The current edition (KFF_CURRENT_SLUG) links to
// the root URL; previous editions link to their competition page.
export const KFF_EDITIONS = [
  { year: 2026, slug: KFF_CURRENT_SLUG },
  { year: 2025, slug: 'kevinge-foursome--fourball-stockholms-golfklubb-2025' },
  { year: 2024, slug: 'kevinge-foursome--fourball-stockholms-golfklubb-2024' },
];
