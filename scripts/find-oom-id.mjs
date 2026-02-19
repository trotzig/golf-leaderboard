#!/usr/bin/env node
// Fetches all Road to Europe OOM IDs from GolfBox and prints the current year's ID.
// Usage: node scripts/find-oom-id.mjs [year]

const year = parseInt(process.argv[2] ?? new Date().getFullYear(), 10);
const customerId = process.env.NEXT_PUBLIC_GOLFBOX_CUSTOMER_ID ?? 1;

const url = `https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerits/CustomerId/${customerId}/language/2057/`;
const res = await fetch(url);
if (!res.ok) throw new Error(`Failed to fetch OOMs: ${res.status}`);

const text = await res.text();
// GolfBox returns JS-style booleans; normalize to valid JSON
const data = JSON.parse(text.replace(/!0/g, 'true').replace(/!1/g, 'false'));

const entries = Object.values(data.OrderOfMeritData).flatMap(season =>
  Object.values(season.Entries),
);

const match = entries.find(e => e.Name === `Road to Europe ${year}`);
if (!match) {
  const available = entries
    .filter(e => e.Name?.startsWith('Road to Europe'))
    .map(e => `  ${e.Season}: ${e.ID}  (${e.Name})`)
    .join('\n');
  console.error(`No "Road to Europe ${year}" found. Available:\n${available}`);
  process.exit(1);
}

console.log(`Road to Europe ${year}: NEXT_PUBLIC_GOLFBOX_OOM_ID=${match.ID}`);
