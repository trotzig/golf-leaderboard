#!/usr/bin/env node
/**
 * Update src/locations.json based on current competitions in the database.
 *
 * Run with:
 *   dotenv node scripts/update-locations.mjs
 *   dotenv -e production.env node scripts/update-locations.mjs
 *
 * For each venue in the DB that is missing from locations.json, the script
 * will attempt a geocode lookup via the free OpenStreetMap Nominatim API.
 * If a match is found it is added automatically; otherwise the venue is
 * printed so you can add coordinates manually.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { startOfYear } from 'date-fns';
import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCATIONS_PATH = join(__dirname, '..', 'src', 'locations.json');

async function geocode(venue) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(venue)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NordicGolfTour/1.0 (schedule map update script)' },
  });
  if (!res.ok) return null;
  const results = await res.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

async function main() {
  const prisma = new PrismaClient();

  const now = Date.now();
  const competitions = await prisma.competition.findMany({
    where: { visible: true, start: { gte: startOfYear(new Date(now)) } },
    select: { name: true, venue: true },
    orderBy: { start: 'asc' },
  });

  await prisma.$disconnect();

  const locations = JSON.parse(readFileSync(LOCATIONS_PATH, 'utf-8'));

  const venues = [
    ...new Set(competitions.map(c => c.venue).filter(Boolean)),
  ];

  console.log(`Found ${venues.length} unique venues across ${competitions.length} competitions.\n`);

  let added = 0;
  let missing = [];

  for (const venue of venues) {
    if (locations[venue]) {
      console.log(`✓  ${venue}`);
      continue;
    }

    process.stdout.write(`?  ${venue} — looking up… `);
    // Throttle requests to respect Nominatim's usage policy (1 req/sec)
    await new Promise(r => setTimeout(r, 1100));
    const coords = await geocode(venue);

    if (coords) {
      locations[venue] = coords;
      console.log(`→ ${coords.lat}, ${coords.lng} (auto-geocoded)`);
      added++;
    } else {
      console.log('NOT FOUND — add manually');
      missing.push(venue);
    }
  }

  if (added > 0) {
    writeFileSync(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + '\n');
    console.log(`\nSaved ${added} new location(s) to public/locations.json`);
  } else {
    console.log('\nNo new locations were added.');
  }

  if (missing.length) {
    console.log('\nVenues still missing coordinates (add manually to public/locations.json):');
    for (const v of missing) {
      console.log(`  "${v}": { "lat": 0, "lng": 0 }`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
