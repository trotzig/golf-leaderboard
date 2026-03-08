#!/usr/bin/env node
/**
 * One-time migration: adds markdown player links to existing report bodies.
 * Queries all players from the database to build a complete name→slug map.
 * Skips series reports (already have links).
 *
 * Requires: DATABASE_URL (via .env / dotenv)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '..', 'src', 'reports');

function normalizeName(name) {
  return name.replace(/\s*\(a\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
}

function addLinksToBody(body, playerMap) {
  // Sort by name length desc so longer/more-specific names are matched first
  const players = [...playerMap.entries()]
    .filter(([, slug]) => slug)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [name, slug] of players) {
    // Skip if this slug is already present as a link
    if (body.includes(`](/${slug})`)) continue;

    // Case-insensitive search
    const lowerBody = body.toLowerCase();
    const lowerName = name.toLowerCase();
    const idx = lowerBody.indexOf(lowerName);
    if (idx === -1) continue;

    // Don't replace if the name is already inside a markdown link bracket
    if (idx > 0 && body[idx - 1] === '[') continue;

    const actualName = body.slice(idx, idx + name.length);
    body =
      body.slice(0, idx) +
      `[${actualName}](/${slug})` +
      body.slice(idx + name.length);
  }

  return body;
}

async function main() {
  const prisma = new PrismaClient();
  let allPlayers;
  try {
    allPlayers = await prisma.player.findMany({
      select: { firstName: true, lastName: true, slug: true },
    });
  } finally {
    await prisma.$disconnect();
  }

  // Build name → slug map
  const playerMap = new Map();
  for (const p of allPlayers) {
    const name = normalizeName(`${p.firstName} ${p.lastName}`);
    if (p.slug && name) playerMap.set(name, p.slug);
  }
  console.log(`Loaded ${allPlayers.length} players from DB (${playerMap.size} with slugs)`);

  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const reportPath = path.join(REPORTS_DIR, file);
    let report;
    try {
      report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch {
      console.log(`Skipping ${file} (parse error)`);
      continue;
    }

    if (report.isSeriesReport) {
      console.log(`Skipping ${file} (series report)`);
      continue;
    }

    const updatedBody = addLinksToBody(report.body, playerMap);
    if (updatedBody !== report.body) {
      report.body = updatedBody;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`Updated:  ${file}`);
    } else {
      console.log(`No changes: ${file}`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
