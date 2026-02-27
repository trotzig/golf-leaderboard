#!/usr/bin/env node
/**
 * Interactively picks a competition from this year and writes a report for it.
 * Scores are fetched live from the GolfBox API so this script works without a
 * fully-synced local database. Existing reports are overwritten if re-selected.
 *
 * Reports are stored as JSON in the src/reports/ folder.
 *
 * Requires: ANTHROPIC_API_KEY env variable, DATABASE_URL (via .env / dotenv)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import prismaClient from '@prisma/client';
import parseJson from './utils/parseJson.mjs';

const { PrismaClient } = prismaClient;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '..', 'src', 'reports');
const PLAYERS_DIR = path.join(__dirname, '..', 'public', 'players');

// Positions that mean the player missed the cut or didn't finish
const MISSED_CUT_STATUSES = new Set(['MC', 'WD', 'DQ', 'DNS', 'RTD']);

function findWinnerImage(playerId) {
  for (const ext of ['jpg', 'png']) {
    const imgPath = path.join(PLAYERS_DIR, `${playerId}.${ext}`);
    if (fs.existsSync(imgPath)) {
      return `/players/${playerId}.${ext}`;
    }
  }
  return null;
}

function fixScoreText(scoreText) {
  if (scoreText === 'E' || scoreText === 'Par') return 'E';
  return scoreText;
}

function formatScoreForArticle(score, scoreText) {
  if (score === 0) return 'even par';
  if (score < 0) return `${score} (${fixScoreText(scoreText)})`;
  return `+${score} (${fixScoreText(scoreText)})`;
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
    if (clazz.Leaderboard && clazz.Leaderboard.Entries) {
      for (const entry of Object.values(clazz.Leaderboard.Entries)) {
        // GolfBox stores ToParValue multiplied by 10000 (e.g. -23 → -230000)
        const rawScore = entry.ScoringToPar.ToParValue;
        const score = Math.round(rawScore / 10000);
        entries.push({
          memberId: entry.MemberID,
          firstName: entry.FirstName.trim(),
          lastName: entry.LastName.trim(),
          clubName: entry.ClubName.trim(),
          position: entry.Position.Calculated, // "1", "T2", "MC", etc.
          positionActual: entry.Position.Actual, // numeric
          score,
          scoreText: entry.ScoringToPar.ToParText,
        });
      }
    }
  }
  return entries;
}

function readApiKey() {
  // Try the env var first (may be empty string if Claude Code cleared it)
  let key = process.env.ANTHROPIC_API_KEY;
  if (key) return key;
  // Fall back to reading directly from .env file
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const match = fs
      .readFileSync(envPath, 'utf8')
      .match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }
  return null;
}

async function callAnthropicAPI(tournamentData) {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set — add it to your .env file');
  }

  const topFinishersText = tournamentData.topFinishers
    .map(
      (f, i) =>
        `  ${i + 1}. ${f.name} (${f.club || 'N/A'}) — ${formatScoreForArticle(
          f.score,
          f.scoreText,
        )}`,
    )
    .join('\n');

  const cutText =
    tournamentData.cutScore !== null
      ? `Cut score: ${formatScoreForArticle(
          tournamentData.cutScore,
          tournamentData.cutScoreText,
        )}`
      : 'No cut information available';

  const marginText =
    tournamentData.marginOfVictory !== null
      ? `Margin of victory: ${tournamentData.marginOfVictory} shot${
          tournamentData.marginOfVictory !== 1 ? 's' : ''
        }`
      : '';

  const priorResultsText =
    tournamentData.winnerPriorResults?.length > 0
      ? `\nWinner's previous results in other tournaments this season:\n${tournamentData.winnerPriorResults
          .map(
            r =>
              `  - ${r.position} at ${r.tournament} (${formatScoreForArticle(
                r.score,
                r.scoreText,
              )})`,
          )
          .join('\n')}`
      : '';

  const headlinesWarning =
    tournamentData.existingHeadlines?.length > 0
      ? `\nIMPORTANT – avoid reusing these headline words/phrases from other reports:\n${tournamentData.existingHeadlines
          .map(h => `  - "${h}"`)
          .join('\n')}\nUse fresh vocabulary and a different structure.`
      : '';

  const prompt = `You are a sports journalist writing a brief article about a professional golf tournament on the Cutter & Buck tour, the Nordic professional golf tour for men.

Write a short article about this tournament. Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
- "headline": A compelling report headline (max 12 words)
- "blurb": A teaser sentence or two (max 40 words) suitable for a homepage preview card
- "body": The report body as a string with paragraphs separated by double newlines (\\n\\n). Write 3–4 paragraphs. Be specific about scores and players. Mention if the win was comfortable or close. Comment on the cut if data is available.${
    priorResultsText
      ? ' If the winner has notable prior results, briefly reference them.'
      : ''
  }
${headlinesWarning}
Tournament: ${tournamentData.name}
Venue: ${tournamentData.venue || 'Nordic Golf Tour'}
Dates: ${tournamentData.startDate} – ${tournamentData.endDate}

Final Leaderboard (top finishers):
${topFinishersText || '  (no results available)'}

Statistics:
- Total players in field: ${tournamentData.totalPlayers}
- Players who made the cut: ${tournamentData.playersMadeCut}
- ${cutText}
- ${marginText}
${priorResultsText}
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

  // Strip markdown code fences if present
  const jsonText = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let article;
  try {
    article = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Failed to parse Anthropic response as JSON: ${content}`);
  }

  if (!article.headline || !article.blurb || !article.body) {
    throw new Error(
      `Anthropic response missing required fields: ${JSON.stringify(article)}`,
    );
  }

  return article;
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Load all existing reports (headline variety + winner history)
  const existingReports = fs
    .readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const existingReportIds = new Set(existingReports.map(a => a.competitionId));

  const prisma = new PrismaClient();

  // List all competitions from this year, newest first
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const [competitions, allPlayers] = await Promise.all([
    prisma.competition.findMany({
      where: { visible: true, end: { gte: yearStart, lt: now } },
      orderBy: { end: 'desc' },
    }),
    prisma.player.findMany({ select: { id: true, slug: true } }),
  ]);
  await prisma.$disconnect();

  if (competitions.length === 0) {
    console.log('No competitions found for this year.');
    process.exit(0);
  }

  console.log('\nSelect a competition:\n');
  competitions.forEach((c, i) => {
    const tag = existingReportIds.has(c.id) ? ' [report exists]' : '';
    console.log(`  ${i + 1}. ${c.name} (${format(c.end, 'MMM d')})${tag}`);
  });

  const answer = await promptUser('\nEnter number: ');
  const idx = parseInt(answer, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= competitions.length) {
    console.error('Invalid selection.');
    process.exit(1);
  }

  const competition = competitions[idx];
  const overwriting = existingReportIds.has(competition.id);
  console.log(
    `\n${overwriting ? 'Overwriting report' : 'Writing report'} for: ${competition.name} (id=${competition.id})`,
  );

  // When overwriting, exclude this competition's old headline so Claude picks a fresh one
  const existingHeadlines = existingReports
    .filter(a => a.competitionId !== competition.id)
    .map(a => a.headline)
    .filter(Boolean);

  const playerSlugs = Object.fromEntries(allPlayers.map(p => [p.id, p.slug]));

  // Fetch the leaderboard directly from the GolfBox API
  console.log('Fetching leaderboard from GolfBox API...');
  const entries = await fetchLeaderboard(competition.id);
  console.log(`  Got ${entries.length} entries`);

  // GolfBox uses sentinel values like 40000 / 50000 for DNF/withdrawn players.
  // Filter those out along with the standard missed-cut position codes.
  const isValidScore = e => Math.abs(e.score) < 1000;
  const finishers = entries.filter(
    e => !MISSED_CUT_STATUSES.has(e.position) && isValidScore(e),
  );
  const missedCut = entries.filter(e => e.position === 'MC');

  // Sort by actual position then score as tiebreak
  finishers.sort((a, b) => {
    if (a.positionActual !== b.positionActual)
      return a.positionActual - b.positionActual;
    return a.score - b.score;
  });

  const topFinishers = finishers.slice(0, 5).map(e => ({
    position: e.position,
    name: `${e.firstName} ${e.lastName}`,
    club: e.clubName,
    score: e.score,
    scoreText: e.scoreText,
    playerId: e.memberId,
    playerSlug: playerSlugs[e.memberId] || null,
  }));

  const winner = topFinishers[0];
  const runnerUp = topFinishers[1];

  // Check winner's previous top placements in existing reports
  const winnerPriorResults = winner
    ? existingReports
        .filter(a => a.competitionId !== competition.id)
        .flatMap(a =>
          (a.stats?.topFinishers || [])
            .filter(f => f.playerId === winner.playerId)
            .map(f => ({
              tournament: a.competitionName,
              position: f.position,
              score: f.score,
              scoreText: f.scoreText,
            })),
        )
    : [];

  if (winnerPriorResults.length > 0) {
    console.log(
      `  Winner's prior results: ${winnerPriorResults
        .map(r => `${r.position} at ${r.tournament}`)
        .join(', ')}`,
    );
  }

  // Cut score: take the best (lowest) score among MC players and subtract 1.
  // The first player to miss the cut is exactly 1 shot over the cut line.
  const missedCutValid = missedCut.filter(isValidScore);
  missedCutValid.sort((a, b) => a.score - b.score);
  const firstMissed = missedCutValid[0] ?? null;
  const cutScore = firstMissed !== null ? firstMissed.score - 1 : null;
  const cutScoreText =
    cutScore === null
      ? null
      : cutScore === 0
      ? 'E'
      : cutScore > 0
      ? `+${cutScore}`
      : `${cutScore}`;

  // Check for winner image
  const winnerImage = winner ? findWinnerImage(winner.playerId) : null;

  const marginOfVictory =
    winner && runnerUp ? runnerUp.score - winner.score : null;

  const tournamentData = {
    name: competition.name,
    venue: competition.venue,
    startDate: format(competition.start, 'MMMM d, yyyy'),
    endDate: format(competition.end, 'MMMM d, yyyy'),
    totalPlayers: entries.length,
    playersMadeCut: finishers.length,
    playersMissedCut: missedCut.length,
    cutScore,
    cutScoreText,
    topFinishers,
    marginOfVictory,
    winnerPriorResults,
    existingHeadlines,
  };

  console.log('\nTournament data:');
  console.log(`  Winner: ${winner?.name} (${winner?.scoreText})`);
  console.log(`  Runner-up: ${runnerUp?.name} (${runnerUp?.scoreText})`);
  console.log(`  Margin: ${marginOfVictory} shots`);
  console.log(
    `  Field: ${entries.length} players, ${finishers.length} made cut`,
  );
  console.log(`  Cut score: ${cutScore} (${cutScoreText})`);
  console.log(`  Winner image: ${winnerImage || 'none'}`);

  console.log('\nCalling Anthropic API...');
  const article = await callAnthropicAPI(tournamentData);

  console.log(`\nHeadline: ${article.headline}`);
  console.log(`Blurb: ${article.blurb}`);

  const reportData = {
    competitionId: competition.id,
    competitionSlug: competition.slug,
    competitionName: competition.name,
    venue: competition.venue,
    startDate: competition.start.toISOString(),
    endDate: competition.end.toISOString(),
    slug: competition.slug,
    headline: article.headline,
    blurb: article.blurb,
    body: article.body,
    winnerName: winner?.name || null,
    winnerPlayerId: winner?.playerId || null,
    winnerPlayerSlug: winner?.playerSlug || null,
    winnerImage,
    stats: {
      winningScore: winner?.score ?? null,
      winningScoreText: winner?.scoreText || null,
      totalPlayers: entries.length,
      playersMadeCut: finishers.length,
      playersMissedCut: missedCut.length,
      cutScore,
      cutScoreText,
      marginOfVictory,
      topFinishers,
    },
    createdAt: new Date().toISOString(),
  };

  const reportPath = path.join(REPORTS_DIR, `${competition.slug}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
