#!/usr/bin/env node
/**
 * Generates an aggregated season summary stats report.
 * Fetches hole-by-hole data from GolfBox API for all finished competitions
 * from the current year, aggregates stats, generates a Claude article, and
 * writes a JSON report to src/reports/season-summary-2026.json.
 *
 * Requires: ANTHROPIC_API_KEY env variable, DATABASE_URL (via .env / dotenv)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import prismaClient from '@prisma/client';
import parseJson from './utils/parseJson.mjs';

const { PrismaClient } = prismaClient;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '..', 'src', 'reports');
const REPORT_SLUG = 'season-summary-2026';

const MISSED_CUT_STATUSES = new Set(['MC', 'WD', 'DQ', 'DNS', 'RTD']);

function promptUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

function readApiKey() {
  let key = process.env.ANTHROPIC_API_KEY;
  if (key) return key;
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const match = fs
      .readFileSync(envPath, 'utf8')
      .match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }
  return null;
}

async function fetchLeaderboard(competitionId) {
  const url = `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch leaderboard for comp ${competitionId}: ${res.status}`,
    );
  }
  const json = parseJson(await res.text());

  const entries = [];
  for (const clazz of json.Classes ? Object.values(json.Classes) : []) {
    if (!clazz.Leaderboard?.Entries) continue;
    for (const entry of Object.values(clazz.Leaderboard.Entries)) {
      const roundHoles = []; // flat list of all {hole, par, strokes, toPar} across all rounds

      if (entry.Rounds) {
        for (const round of Object.values(entry.Rounds)) {
          if (!round.HoleScores) continue;
          for (const [holeKey, holeData] of Object.entries(round.HoleScores)) {
            // Skip summary keys
            if (
              holeKey === 'H-TOTAL' ||
              holeKey === 'H-OUT' ||
              holeKey === 'H-IN'
            )
              continue;
            const holeNumber = parseInt(holeKey.replace('H', ''), 10);
            if (isNaN(holeNumber)) continue;
            if (!holeData.Result) continue;

            const strokes = Math.round(holeData.Result.ActualValue ?? 0);
            const toPar = Math.round(holeData.Result.ToParValue ?? 0);
            const par = holeData.Par ?? 0;

            if (strokes === 0) continue; // hole not played

            roundHoles.push({ hole: holeNumber, par, strokes, toPar });
          }
        }
      }

      entries.push({
        memberId: entry.MemberID,
        firstName: entry.FirstName?.trim() || '',
        lastName: entry.LastName?.trim() || '',
        clubName: entry.ClubName?.trim() || '',
        position: entry.Position.Calculated, // "1", "T2", "MC", etc.
        positionActual: entry.Position.Actual, // numeric
        roundHoles,
      });
    }
  }
  return entries;
}

async function generateArticle(stats, competitions, extraContext) {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set — add it to your .env file');
  }

  const compCount = competitions.length;
  const compNames = competitions.map(c => c.name).join(', ');

  // Build a deduplicated player reference list (name → slug) for all stats
  const playerLinks = new Map();
  const addLink = (name, slug) => {
    if (name && slug) playerLinks.set(name, slug);
  };
  stats.topBirdies.forEach(p => addLink(p.name, p.playerSlug));
  stats.topEagles.forEach(p => addLink(p.name, p.playerSlug));
  stats.holeInOnes.forEach(h => addLink(h.name, h.playerSlug));
  stats.madeAllCuts.forEach(p => addLink(p.name, p.playerSlug));

  const playerLinksText = [...playerLinks.entries()]
    .map(([name, slug]) => `  - [${name}](/${slug})`)
    .join('\n');

  const birdiesText = stats.topBirdies
    .map(
      (p, i) =>
        `  ${i + 1}. [${p.name}](/${p.playerSlug || p.name}) — ${
          p.count
        } birdies`,
    )
    .join('\n');

  const eaglesText = stats.topEagles
    .map(
      (p, i) =>
        `  ${i + 1}. [${p.name}](/${p.playerSlug || p.name}) — ${
          p.count
        } eagles`,
    )
    .join('\n');

  const holeInOnesText =
    stats.holeInOnes.length > 0
      ? stats.holeInOnes
          .map(
            h =>
              `  - [${h.name}](/${h.playerSlug || h.name}) on hole ${
                h.hole
              } at ${h.venue}`,
          )
          .join('\n')
      : '  None recorded';

  const madeAllCutsText =
    stats.madeAllCuts.length > 0
      ? stats.madeAllCuts
          .map(p => `  - [${p.name}](/${p.playerSlug || p.name})`)
          .join('\n')
      : '  None';

  const prompt = `You are a sports journalist writing a brief stats summary article about the season so far on the Cutter & Buck Tour, the Nordic professional golf tour for men. The audience are mostly people in Sweden, Denmark, Norway and Finland. They speak English but keep the language at a reasonable level for them.

Write a short stats-focused article covering the highlights from the season so far (${compCount} completed tournament${
    compCount !== 1 ? 's' : ''
  }: ${compNames}). Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
- "headline": A compelling headline (max 12 words). Use sentence case.
- "blurb": A teaser sentence or two (max 40 words) suitable for a homepage preview card
- "body": The article body as a string with paragraphs separated by double newlines (\\n\\n). Write 3–4 paragraphs. Highlight the birdie and eagle leaders, any hole-in-ones, and who has been most consistent (players who have made every cut). There are both amateurs (has an "(a)" in the name) and professionals — don't mention their amateur/professional status. When mentioning a player by name, use a markdown link from the player list below — use each player link at most once across the whole article.

Player links (use exactly as shown):
${playerLinksText}

Statistics from all ${compCount} completed tournament${
    compCount !== 1 ? 's' : ''
  }:

Top birdie scorers:
${birdiesText}

Top eagle scorers:
${eaglesText || '  None recorded'}

Hole-in-ones:
${holeInOnesText}

Players who made every cut:
${madeAllCutsText}
${extraContext ? `\nAdditional context from the editor (incorporate where relevant):\n${extraContext}\n` : ''}
Return only the raw JSON object.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.content[0].text.trim();
  const jsonText = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let article;
  try {
    article = JSON.parse(jsonText);
  } catch {
    throw new Error(`Failed to parse Anthropic response as JSON: ${content}`);
  }

  if (!article.headline || !article.blurb || !article.body) {
    throw new Error(
      `Anthropic response missing required fields: ${JSON.stringify(article)}`,
    );
  }

  return article;
}

async function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const prisma = new PrismaClient();

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Fetch all finished competitions from this year, plus player slugs
  const [competitions, allPlayers] = await Promise.all([
    prisma.competition.findMany({
      where: { visible: true, end: { gte: yearStart, lt: now } },
      orderBy: { end: 'asc' },
    }),
    prisma.player.findMany({
      select: { id: true, slug: true },
    }),
  ]);

  await prisma.$disconnect();

  if (competitions.length === 0) {
    console.log('No finished competitions found for this year.');
    process.exit(0);
  }

  console.log(`Found ${competitions.length} finished competition(s):`);
  competitions.forEach(c => console.log(`  - ${c.name} (id=${c.id})`));

  const playerSlugMap = Object.fromEntries(allPlayers.map(p => [p.id, p.slug]));

  // Accumulators
  const birdieCount = {}; // memberId -> count
  const eagleCount = {}; // memberId -> count
  const holeInOnes = []; // { memberId, name, hole, venue }
  const playerMadeCut = {}; // memberId -> { [competitionId]: boolean }
  const playerNames = {}; // memberId -> "First Last"

  for (const comp of competitions) {
    console.log(`\nFetching: ${comp.name} (id=${comp.id})...`);
    const entries = await fetchLeaderboard(comp.id);
    console.log(`  Entries: ${entries.length}`);

    for (const entry of entries) {
      const { memberId, firstName, lastName, position, roundHoles } = entry;
      const name = `${firstName} ${lastName}`.trim();
      playerNames[memberId] = name;

      if (!playerMadeCut[memberId]) playerMadeCut[memberId] = {};
      playerMadeCut[memberId][comp.id] = !MISSED_CUT_STATUSES.has(position);

      // Count hole-level stats
      for (const { hole, strokes, toPar } of roundHoles) {
        if (toPar < 0) {
          // birdie or better
          birdieCount[memberId] = (birdieCount[memberId] || 0) + 1;
        }
        if (toPar <= -2) {
          // eagle, albatross, condor
          eagleCount[memberId] = (eagleCount[memberId] || 0) + 1;
        }
        if (strokes === 1) {
          // hole-in-one
          holeInOnes.push({
            memberId,
            name,
            playerSlug: playerSlugMap[memberId] || null,
            hole,
            venue: comp.venue || comp.name,
            competitionName: comp.name,
          });
        }
      }
    }
  }

  // Top 5 birdies
  const topBirdies = Object.entries(birdieCount)
    .map(([id, count]) => ({
      id,
      name: playerNames[id] || id,
      playerSlug: playerSlugMap[id] || null,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top 3 eagles
  const topEagles = Object.entries(eagleCount)
    .map(([id, count]) => ({
      id,
      name: playerNames[id] || id,
      playerSlug: playerSlugMap[id] || null,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Players who made ALL cuts (entered every competition and never missed cut)
  const allCompIds = competitions.map(c => c.id);
  const madeAllCuts = Object.entries(playerMadeCut)
    .filter(([, cutResults]) => {
      return allCompIds.every(id => cutResults[id] === true);
    })
    .map(([id]) => ({
      id,
      name: playerNames[id] || id,
      playerSlug: playerSlugMap[id] || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log('\n--- Aggregated Stats ---');
  console.log(
    `Top birdies: ${topBirdies.map(p => `${p.name} (${p.count})`).join(', ')}`,
  );
  console.log(
    `Top eagles: ${
      topEagles.length
        ? topEagles.map(p => `${p.name} (${p.count})`).join(', ')
        : 'none'
    }`,
  );
  console.log(
    `Hole-in-ones: ${
      holeInOnes.length
        ? holeInOnes
            .map(h => `${h.name} hole ${h.hole} at ${h.venue}`)
            .join('; ')
        : 'none'
    }`,
  );
  console.log(
    `Made all cuts: ${
      madeAllCuts.length ? madeAllCuts.map(p => p.name).join(', ') : 'none'
    }`,
  );

  const stats = {
    competitions: competitions.map(c => ({
      id: c.id,
      name: c.name,
      venue: c.venue,
      slug: c.slug,
    })),
    topBirdies,
    topEagles,
    holeInOnes,
    madeAllCuts,
  };

  // Anchor to the last finished competition
  const lastComp = competitions[competitions.length - 1];

  const extraContext = await promptUser(
    '\nAny additional context for the article? (press Enter to skip)\n> ',
  );

  console.log('\nCalling Anthropic API to generate article...');
  const article = await generateArticle(stats, competitions, extraContext);
  console.log(`\nHeadline: ${article.headline}`);
  console.log(`Blurb:    ${article.blurb}`);

  const reportData = {
    competitionId: lastComp.id,
    competitionSlug: lastComp.slug,
    competitionName: lastComp.name,
    venue: lastComp.venue,
    startDate: competitions[0].start.toISOString(),
    endDate: new Date(lastComp.end.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    slug: REPORT_SLUG,
    headline: article.headline,
    blurb: article.blurb,
    body: article.body,
    winnerName: null,
    winnerPlayerId: null,
    winnerPlayerSlug: null,
    winnerImage: null,
    isSeriesReport: true,
    stats,
    createdAt: new Date().toISOString(),
  };

  const reportPath = path.join(REPORTS_DIR, `${REPORT_SLUG}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
