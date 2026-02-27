/**
 * Downloads player images from owgr.com for all players in the database.
 *
 * Default mode: only processes players without an existing owgr/<id>.json file.
 * Stores owgr/<id>.json per player with { owgrUrl, hasImage }.
 *
 * --update flag: re-fetches the image from the stored owgrUrl for all players
 * that have a json with hasImage=true, without doing a new search.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import prismaClient from '@prisma/client';
const { PrismaClient } = prismaClient;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'players');
const OWGR_DIR = path.join(__dirname, '..', 'owgr');

const UPDATE_MODE = process.argv.includes('--update');

// Normalize a name for searching: strip special chars to ASCII equivalents
function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/ø/gi, 'o')
    .replace(/æ/gi, 'ae')
    .replace(/å/gi, 'a')
    .replace(/ð/gi, 'd')
    .replace(/þ/gi, 'th')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function readJson(golfId) {
  const p = path.join(OWGR_DIR, `${golfId}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(golfId, data) {
  fs.writeFileSync(
    path.join(OWGR_DIR, `${golfId}.json`),
    JSON.stringify(data, null, 2),
  );
}

// Search OWGR API and return the best-matching player's numeric ID
async function searchOwgr(firstName, lastName) {
  const term = normalize(`${lastName} ${firstName.split(' ')[0]}`);
  const url = `https://apiweb.owgr.com/api/owgr/search/getSearchResults?searchTerm=${encodeURIComponent(
    term,
  )}&eventsPageSize=0&playersPageSize=10&newsPageSize=0`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.playersSearchResults || [];
  if (!results.length) return null;

  const normLast = normalize(lastName).toLowerCase();
  const normFirst = normalize(firstName.split(' ')[0]).toLowerCase();

  const match =
    results.find(p => {
      const pLast = normalize(p.lastName)
        .toLowerCase()
        .replace(/\(am\)/i, '')
        .trim();
      const pFirst = normalize(p.firstName).toLowerCase();
      return pLast === normLast && pFirst.startsWith(normFirst);
    }) ||
    results.find(p => {
      const pLast = normalize(p.lastName)
        .toLowerCase()
        .replace(/\(am\)/i, '')
        .trim();
      return pLast === normLast;
    }) ||
    results[0];

  return match ? match.id : null;
}

// Build the OWGR profile URL from owgrId + name
function buildOwgrUrl(owgrId, firstName, lastName) {
  const slug = `${normalize(firstName)
    .toLowerCase()
    .replace(/\s+/g, '-')}-${normalize(lastName)
    .toLowerCase()
    .replace(/\s+/g, '-')}-${owgrId}`;
  return `https://www.owgr.com/playerprofile/${slug}`;
}

// Fetch the OWGR profile page and extract the image URL
async function scrapeImageUrl(owgrUrl) {
  const res = await fetch(owgrUrl);
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = JSON.parse($('#__NEXT_DATA__').text());
  const playerProfileData =
    nextData.props.pageProps.playerProfileData.playerProfileData;
  const imageUrl = playerProfileData.playerImageURL;
  return imageUrl;
}

// Download image to file
async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
  return true;
}

// Normal mode: search for player, scrape image, store json
async function processPlayerSearch(player) {
  const owgrId = await searchOwgr(player.firstName, player.lastName);
  if (!owgrId) {
    console.log(
      `  [miss] ${player.firstName} ${player.lastName} — not found in search`,
    );
    return 'not_found';
  }

  const owgrUrl = buildOwgrUrl(owgrId, player.firstName, player.lastName);
  const imageUrl = await scrapeImageUrl(owgrUrl);

  if (!imageUrl) {
    console.log(
      `  [nophoto] ${player.firstName} ${player.lastName} — ${owgrUrl}`,
    );
    writeJson(player.id, { owgrUrl, hasImage: false });
    return 'no_photo';
  }
  const regex = /\.(jpg|png)/;
  const match = imageUrl.match(regex);
  if (!match) {
    console.log(
      `  [nophoto] ${player.firstName} ${player.lastName} — ${owgrUrl}. Image URL not following pattern: ${imageUrl}`,
    );
    writeJson(player.id, { owgrUrl, hasImage: false });
    return 'no_photo';
  }

  const ext = match[1];
  const destPath = path.join(OUTPUT_DIR, `${player.id}.${ext}`);
  const ok = await downloadImage(imageUrl, destPath);
  if (ok) {
    const size = fs.statSync(destPath).size;
    console.log(
      `  [ok] ${player.firstName} ${player.lastName} — ${Math.round(
        size / 1024,
      )}KB`,
    );
    writeJson(player.id, { owgrUrl, hasImage: true });
    return 'downloaded';
  } else {
    console.log(
      `  [err] ${player.firstName} ${player.lastName} — download failed`,
    );
    return 'error';
  }
}

// Update mode: re-fetch image using stored owgrUrl
async function processPlayerUpdate(player) {
  const json = readJson(player.id);
  if (!json) return 'skipped';

  const imageUrl = await scrapeImageUrl(json.owgrUrl);

  const regex = /\.(jpg|png)/;
  if (!imageUrl || !regex.test(imageUrl)) {
    // Check if a local image exists (may have been added manually)
    const localFile = ['jpg', 'png']
      .map(ext => path.join(OUTPUT_DIR, `${player.id}.${ext}`))
      .find(p => fs.existsSync(p));
    if (localFile) {
      console.log(
        `  [kept] ${player.firstName} ${player.lastName} — photo removed on OWGR but keeping local file`,
      );
      return 'no_photo';
    }
    console.log(
      `  [nophoto] ${player.firstName} ${player.lastName} — photo removed on OWGR`,
    );
    writeJson(player.id, { ...json, hasImage: false });
    return 'no_photo';
  }

  const ext = imageUrl.match(regex)[1];
  const destPath = path.join(OUTPUT_DIR, `${player.id}.${ext}`);
  const ok = await downloadImage(imageUrl, destPath);
  if (ok) {
    const size = fs.statSync(destPath).size;
    console.log(
      `  [ok] ${player.firstName} ${player.lastName} — ${Math.round(
        size / 1024,
      )}KB`,
    );
    writeJson(player.id, { ...json, hasImage: true });
    return 'downloaded';
  } else {
    console.log(
      `  [err] ${player.firstName} ${player.lastName} — download failed`,
    );
    return 'error';
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(OWGR_DIR, { recursive: true });

  const prisma = new PrismaClient();
  const allPlayers = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true, oomPosition: true },
  });
  await prisma.$disconnect();

  const players = allPlayers.sort((a, b) => {
    const av = parseInt((a.oomPosition || '').replace(/^T/, ''), 10);
    const bv = parseInt((b.oomPosition || '').replace(/^T/, ''), 10);
    return (isNaN(av) ? 99999999 : av) - (isNaN(bv) ? 99999999 : bv);
  });

  if (UPDATE_MODE) {
    // Update mode: all players with a json file
    const todo = players.filter(p => readJson(p.id) !== null);

    console.log(`Mode: --update`);
    console.log(`Players with existing image to refresh: ${todo.length}\n`);

    const stats = { downloaded: 0, no_photo: 0, skipped: 0, error: 0 };
    for (const player of todo) {
      const result = await processPlayerUpdate(player);
      stats[result]++;
      await sleep(300);
    }

    console.log('\nDone!');
    console.log(`  Updated: ${stats.downloaded}`);
    console.log(`  Photo removed on OWGR: ${stats.no_photo}`);
    console.log(`  Errors: ${stats.error}`);
  } else {
    // Default mode: only players without a json file yet
    const todo = players.filter(p => !readJson(p.id));

    console.log(`Mode: search (default)`);
    console.log(`Total players: ${players.length}`);
    console.log(`Already processed: ${players.length - todo.length}`);
    console.log(`To process: ${todo.length}\n`);

    const stats = { downloaded: 0, not_found: 0, no_photo: 0, error: 0 };
    for (const player of todo) {
      const result = await processPlayerSearch(player);
      stats[result]++;
      await sleep(300);
    }

    console.log('\nDone!');
    console.log(`  Downloaded: ${stats.downloaded}`);
    console.log(`  No photo on OWGR: ${stats.no_photo}`);
    console.log(`  Not found: ${stats.not_found}`);
    console.log(`  Errors: ${stats.error}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
