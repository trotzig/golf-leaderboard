#!/usr/bin/env node
/**
 * Interactively picks a competition from this year and writes a report for it.
 * Scores are fetched live from the GolfBox API so this script works without a
 * fully-synced local database. Existing reports are overwritten if re-selected.
 *
 * Reports are stored as JSON in the src/reports/ folder.
 *
 * Usage:
 *   writeReport.mjs                      pick a competition interactively
 *   writeReport.mjs <slug>               write a report for a specific competition
 *   writeReport.mjs --missing            list competitions without a report
 *   writeReport.mjs <slug> --non-interactive
 *                                        skip the context prompt and editor step
 *                                        (also implied when stdin is not a TTY)
 *
 * Requires: ANTHROPIC_API_KEY env variable, DATABASE_URL (via .env / dotenv)
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { spawnSync } from 'child_process';
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

  // Extract status text from ClassSettings — this is where GolfBox describes
  // play-offs, weather cancellations, etc.
  let statusText = null;
  const classSettings = json.CompetitionData?.ClassSettings;
  if (Array.isArray(classSettings)) {
    for (const cs of classSettings) {
      if (cs.StatusText) {
        // Strip HTML tags and decode &nbsp; / <br /> into plain text
        const plain = cs.StatusText.replace(/<br\s*\/?>/gi, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (plain) {
          statusText = plain;
          break;
        }
      }
    }
  }

  const type = json.CompetitionData?.Type || null;

  // GolfBox stores ToParValue multiplied by 10000 (e.g. -23 → -230000).
  const roundTotals = rounds =>
    Object.entries(rounds || []).flatMap(([roundKey, round]) => {
      const total = round.HoleScores && round.HoleScores['H-TOTAL'];
      return total && total.Score > 0
        ? [{ roundNumber: roundKey.replace('R', ''), grossScore: total.Score }]
        : [];
    });

  const entries = [];
  // Team competitions (pairs/foursomes) leave `Entries` empty and expose the
  // standings under `Leaderboard.Teams` instead, each team carrying its member
  // players, a combined score, and per-round aggregate scores.
  const teams = [];
  for (const clazz of json.Classes ? Object.values(json.Classes) : []) {
    if (clazz.Leaderboard && clazz.Leaderboard.Entries) {
      for (const entry of Object.values(clazz.Leaderboard.Entries)) {
        const score = Math.round(entry.ScoringToPar.ToParValue / 10000);
        entries.push({
          memberId: entry.MemberID,
          firstName: entry.FirstName.trim(),
          lastName: entry.LastName.trim(),
          clubName: entry.ClubName.trim(),
          position: entry.Position.Calculated, // "1", "T2", "MC", etc.
          positionActual: entry.Position.Actual, // numeric
          score,
          scoreText: entry.ScoringToPar.ToParText,
          rounds: roundTotals(entry.Rounds),
        });
      }
    }
    if (clazz.Leaderboard && clazz.Leaderboard.Teams) {
      for (const team of Object.values(clazz.Leaderboard.Teams)) {
        const members = Object.values(team.Entries || {}).map(m => ({
          memberId: m.MemberID,
          firstName: (m.FirstName || '').trim(),
          lastName: (m.LastName || '').trim(),
          clubName: (m.ClubName || '').trim(),
        }));
        const rawScore =
          team.ScoringToPar?.ToParValue ?? team.ResultSum?.ToParValue ?? 0;
        teams.push({
          name: members
            .map(m => `${m.firstName} ${m.lastName}`.trim())
            .join(' & '),
          members,
          position: team.Position?.Calculated,
          positionActual: team.Position?.Actual,
          score: Math.round(rawScore / 10000),
          scoreText: team.ScoringToPar?.ToParText ?? team.ResultSum?.ToParText,
          rounds: roundTotals(team.Rounds),
        });
      }
    }
  }
  return { entries, teams, statusText, type };
}

// Render a GolfBox match play result string into readable text.
// "6&5" → "6 & 5"; "1 Hole"/"2 Holes" → "1 up"/"2 up"; "19th" (a sudden-death
// win on the 19th hole) → "on the 19th hole"; anything else is passed through.
function formatMatchResult(result) {
  if (!result) return '';
  const holes = result.match(/^(\d+)&(\d+)$/);
  if (holes) return `${holes[1]} & ${holes[2]}`;
  const up = result.match(/^(\d+) Holes?$/);
  if (up) return `${up[1]} up`;
  if (/^\d+(st|nd|rd|th)$/.test(result)) return `on the ${result} hole`;
  return result;
}

// Match play tournaments expose no leaderboard; the bracket and results live in
// the MatchplayHandler feed. Parse it into completed rounds with a winner and
// loser per match, capped at the "real" rounds (NumberOfRounds) so GolfBox's
// trailing placement rounds are ignored.
async function fetchMatchplay(competitionId) {
  const url = `https://scores.golfbox.dk/Handlers/MatchplayHandler/GetMatchplay/CompetitionId/${competitionId}/language/2057/`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch match play data for comp ${competitionId}: ${res.status}`,
    );
  }
  const json = parseJson(await res.text());
  const classes = json.Matchplay ? Object.values(json.Matchplay) : [];
  if (!classes.length) return null;
  const clazz = classes[0];

  const roundNames = {};
  for (const r of json.CompetitionData?.RoundSetup || []) {
    roundNames[r.Number] = r.Name;
  }
  const maxRounds = clazz.NumberOfRounds || Infinity;

  const toPlayer = e =>
    e && e.EntryId
      ? {
          memberId: e.MemberID,
          name: `${e.FirstName} ${e.LastName}`.replace(/\s+/g, ' ').trim(),
          club: e.ClubName ? e.ClubName.trim() : null,
        }
      : null;

  const rounds = [];
  for (const roundKey of Object.keys(clazz.Rounds || {})) {
    const round = clazz.Rounds[roundKey];
    if (round.Number > maxRounds) continue;
    const matches = Object.values(round.Matches || {})
      .filter(m => m.HoleText === 'F') // only completed matches
      .sort((a, b) => (a.OrderNo || a.MatchNo) - (b.OrderNo || b.MatchNo))
      .map(m => {
        const entries = m.Entries || [];
        return {
          result: formatMatchResult(m.Result),
          winner: toPlayer(entries.find(e => e.IsLead)),
          loser: toPlayer(entries.find(e => e && e.EntryId && !e.IsLead)),
        };
      })
      .filter(m => m.winner && m.loser);
    rounds.push({
      number: round.Number,
      name: roundNames[round.Number] || `Round ${round.Number}`,
      matches,
    });
  }

  const finalRound = rounds.find(r => r.number === maxRounds);
  const finalMatch = finalRound?.matches[0];
  if (!finalMatch) return null; // final not played yet

  const semiRound = rounds.find(r => r.number === maxRounds - 1);
  const semifinalists = semiRound ? semiRound.matches.map(m => m.loser) : [];

  // The champion's route to the title: the match they won in each round.
  const championPath = rounds
    .map(r => {
      const m = r.matches.find(
        m => m.winner.memberId === finalMatch.winner.memberId,
      );
      return m
        ? { round: r.name, opponent: m.loser.name, result: m.result }
        : null;
    })
    .filter(Boolean);

  // Field size = players in the first round.
  const firstRound = rounds[0];
  const fieldSize = firstRound ? firstRound.matches.length * 2 : null;

  return {
    isCompleted: clazz.IsCompleted,
    champion: finalMatch.winner,
    finalist: finalMatch.loser,
    finalResult: finalMatch.result,
    semifinalists,
    championPath,
    fieldSize,
    rounds,
  };
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

const JOURNALIST_INTRO = `You are a sports journalist writing a brief article about a professional golf tournament on the Cutter & Buck tour, the Nordic professional golf tour for men. The audience are mostly people in Sweden, Denmark, Norway and Finland — write primarily for Swedish and Danish readers.

Language rules (important — most readers learned English in school and struggle with idioms):
- Use plain, common English. Prefer short, everyday words over fancy or literary ones.
- Avoid idioms, figurative phrases and sports clichés. Examples to avoid: "held his nerve", "slipped away", "bragging rights", "rounded out", "fell short", "no doubt", "down the stretch", "in the mix", "punched his ticket", "kept his cool", "underlined", "remarkable", "composure", "tightly bunched", "the stage was set".
- Don't use words a Swedish/Danish reader is unlikely to know. Replace with simpler ones: use "showed" not "displayed", "ended" not "concluded", "won" not "clinched", "close" not "narrow", "good" not "stellar", "playing well" not "in form".
- Write direct, factual sentences. Describe what happened with scores and players — don't dramatise.
- Don't use Latin-derived rare words when a plain word works.`;

// Send a fully-built prompt to the Anthropic API and return the parsed article.
async function requestArticle(prompt) {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set — add it to your .env file');
  }

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

async function callAnthropicAPIMatchPlay(matchData, playerLinksText, extraContext) {
  const playerLinksSection = playerLinksText
    ? `\nPlayer links (use exactly as shown, at most once each):\n${playerLinksText}\n`
    : '';
  const extraContextSection = extraContext
    ? `\nAdditional context from the editor (incorporate where relevant):\n${extraContext}\n`
    : '';

  const pathText = matchData.championPath
    .map(p => `  - ${p.round}: beat ${p.opponent} (${p.result})`)
    .join('\n');

  const semifinalistsText = matchData.semifinalists.length
    ? `Losing semi-finalists: ${matchData.semifinalists
        .map(s => s.name)
        .join(', ')}`
    : '';

  const headlinesWarning =
    matchData.existingHeadlines?.length > 0
      ? `\nIMPORTANT – avoid reusing these headline words/phrases from other reports:\n${matchData.existingHeadlines
          .map(h => `  - "${h}"`)
          .join('\n')}\nUse fresh vocabulary and a different structure.`
      : '';

  const statusNote = matchData.statusText
    ? `\nOfficial tournament note: ${matchData.statusText}`
    : '';

  const prompt = `${JOURNALIST_INTRO}

This is a MATCH PLAY (knockout) tournament, not stroke play. Players meet one-on-one and the loser is knocked out each round, all the way to the final. There is no total score to par and no cut. Results are match play margins:
- "3 & 2" means the winner was 3 holes ahead with only 2 holes left, so the match ended early.
- "1 up" / "2 up" means the winner was ahead by that many holes after all 18 holes.
- "on the 19th hole" (or higher) means the match was level after 18 holes and was decided in sudden death.

Write a short article about this tournament. Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
- "headline": A compelling report headline (max 12 words). Use sentence case.
- "blurb": A teaser sentence or two (max 40 words) suitable for a homepage preview card. Plain text only — no markdown, no links.
- "body": The report body as a string with paragraphs separated by double newlines (\\n\\n). Write 3–4 paragraphs. Focus on who won the title and how the final went (opponent and margin). Describe the champion's route through the bracket, mentioning notable wins and margins. Mention the beaten finalist and the losing semi-finalists. Do not invent scores to par or a cut — there are none in match play. There are both amateurs (has an "(a)" in the name) and professionals; don't mention their amateur/professional status. When mentioning a player by name in the body, use a markdown link from the player list below — use each player link at most once across the body. Do not use markdown links in the blurb.
${headlinesWarning}
Tournament: ${matchData.name}
Venue: ${matchData.venue || 'Nordic Golf Tour'}
Dates: ${matchData.startDate} – ${matchData.endDate}
Format: match play knockout${matchData.fieldSize ? `, ${matchData.fieldSize}-player field` : ''}

Champion: ${matchData.champion.name}${matchData.champion.club ? ` (${matchData.champion.club})` : ''}
Final: ${matchData.champion.name} beat ${matchData.finalist.name} ${matchData.finalResult} in the final
${semifinalistsText}

Champion's route to the title:
${pathText}
${statusNote}${playerLinksSection}${extraContextSection}
Return only the raw JSON object.`;

  return requestArticle(prompt);
}

async function callAnthropicAPI(tournamentData, playerLinksText, extraContext) {
  const playerLinksSection = playerLinksText
    ? `\nPlayer links (use exactly as shown, at most once each):\n${playerLinksText}\n`
    : '';
  const extraContextSection = extraContext
    ? `\nAdditional context from the editor (incorporate where relevant):\n${extraContext}\n`
    : '';
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

  const extraordinaryRoundsText =
    tournamentData.extraordinaryRounds?.length > 0
      ? `\nExtraordinary rounds (gross score ≤ 63) — could be mentioned in the article:\n${tournamentData.extraordinaryRounds
          .map(
            r =>
              `  - ${r.playerName} shot a ${r.grossScore} in round ${r.roundNumber}`,
          )
          .join('\n')}`
      : '';

  const headlinesWarning =
    tournamentData.existingHeadlines?.length > 0
      ? `\nIMPORTANT – avoid reusing these headline words/phrases from other reports:\n${tournamentData.existingHeadlines
          .map(h => `  - "${h}"`)
          .join('\n')}\nUse fresh vocabulary and a different structure.`
      : '';

  const playOffNote = tournamentData.playOffText
    ? `\nPLAY-OFF NOTE (must be mentioned in the article): ${tournamentData.playOffText}`
    : '';

  // Include the raw status text unless it's already being surfaced as the play-off note
  // (playOffText === statusText when the play-off was detected via StatusText itself).
  const statusNote =
    tournamentData.statusText && tournamentData.statusText !== tournamentData.playOffText
      ? `\nOfficial tournament note: ${tournamentData.statusText}`
      : '';

  const prompt = `${JOURNALIST_INTRO}

Write a short article about this tournament. Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
- "headline": A compelling report headline (max 12 words). Use sentence case.
- "blurb": A teaser sentence or two (max 40 words) suitable for a homepage preview card. Plain text only — no markdown, no links.
- "body": The report body as a string with paragraphs separated by double newlines (\\n\\n). Write 3–4 paragraphs. Be specific about scores and players. Mention if the win was comfortable or close. Comment on the cut if data is available. There are both amateurs (has an "(a)" in the name) and professionals. Don't mention their amateur/professional status, it has little value on this tour. The cut is almost always at 45 players. You can mention the number of players making the cut but don't make a big thing about it. The cut score is more interesting.${
    priorResultsText
      ? ' If the winner has notable prior results, briefly reference them.'
      : ''
  }${extraordinaryRoundsText ? ' Any extraordinary rounds listed below could be mentioned in the article.' : ''}${playOffNote ? ' The tournament ended in a play-off — this MUST be prominently mentioned.' : ''} When mentioning a player by name in the body, use a markdown link from the player list below — use each player link at most once across the body. Do not use markdown links in the blurb.
${extraordinaryRoundsText}${playOffNote}${statusNote}${headlinesWarning}
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
${priorResultsText}${playerLinksSection}${extraContextSection}
Return only the raw JSON object.`;

  return requestArticle(prompt);
}

async function callAnthropicAPITeam(teamData, playerLinksText, extraContext) {
  const playerLinksSection = playerLinksText
    ? `\nPlayer links (use exactly as shown, at most once each):\n${playerLinksText}\n`
    : '';
  const extraContextSection = extraContext
    ? `\nAdditional context from the editor (incorporate where relevant):\n${extraContext}\n`
    : '';

  const topFinishersText = teamData.topFinishers
    .map(
      (t, i) =>
        `  ${i + 1}. ${t.name} (${t.club || 'N/A'}) — ${formatScoreForArticle(
          t.score,
          t.scoreText,
        )}`,
    )
    .join('\n');

  const marginText =
    teamData.marginOfVictory > 0
      ? `Margin of victory: ${teamData.marginOfVictory} shot${
          teamData.marginOfVictory !== 1 ? 's' : ''
        }`
      : '';

  const tieNote = teamData.tiedAtTop
    ? `\nPLAY-OFF/COUNTBACK NOTE (must be mentioned): ${teamData.winnerName} and ${teamData.runnerUpName} both finished level at ${teamData.topScoreText}. ${teamData.winnerName} won on a play-off or countback. Say the teams finished level and do not state a shot margin between them.`
    : '';

  const headlinesWarning =
    teamData.existingHeadlines?.length > 0
      ? `\nIMPORTANT – avoid reusing these headline words/phrases from other reports:\n${teamData.existingHeadlines
          .map(h => `  - "${h}"`)
          .join('\n')}\nUse fresh vocabulary and a different structure.`
      : '';

  const statusNote = teamData.statusText
    ? `\nOfficial tournament note: ${teamData.statusText}`
    : '';

  const prompt = `${JOURNALIST_INTRO}

This is a TEAM stroke-play tournament. Players compete in teams (usually pairs), and the team's combined score to par decides the standings. There is normally no individual cut. Refer to teams by both players' names.

Write a short article about this tournament. Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
- "headline": A compelling report headline (max 12 words). Use sentence case.
- "blurb": A teaser sentence or two (max 40 words) suitable for a homepage preview card. Plain text only — no markdown, no links.
- "body": The report body as a string with paragraphs separated by double newlines (\\n\\n). Write 3–4 paragraphs. Focus on the winning team (both players) and their combined score. Mention if the win was comfortable or close, and name the runner-up team. There are both amateurs (has an "(a)" in the name) and professionals; don't mention their amateur/professional status. When mentioning a player by name in the body, use a markdown link from the player list below — use each player link at most once across the body. Do not use markdown links in the blurb.
${headlinesWarning}
Tournament: ${teamData.name}
Venue: ${teamData.venue || 'Nordic Golf Tour'}
Dates: ${teamData.startDate} – ${teamData.endDate}
Format: team stroke play${teamData.totalTeams ? `, ${teamData.totalTeams} teams` : ''}

Final Leaderboard (top teams):
${topFinishersText || '  (no results available)'}

Statistics:
- Total teams in field: ${teamData.totalTeams}${marginText ? `\n- ${marginText}` : ''}
${tieNote}${statusNote}${playerLinksSection}${extraContextSection}
Return only the raw JSON object.`;

  return requestArticle(prompt);
}

const args = process.argv.slice(2);
const NON_INTERACTIVE =
  args.includes('--non-interactive') || !process.stdin.isTTY;

// In non-interactive mode, prompts resolve to `fallback` without reading stdin.
function promptUser(question, fallback = '') {
  if (NON_INTERACTIVE) return Promise.resolve(fallback);
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

// Serialise the article into a human-editable text format with clearly marked
// sections. The body keeps real blank lines between paragraphs (rather than the
// literal \n\n stored in JSON) so it's pleasant to edit.
function articleToEditable(article) {
  return [
    '# Edit the report below. Lines starting with "#" are section markers —',
    '# keep them. Lines starting with ";" are comments and will be ignored.',
    ';',
    '# HEADLINE',
    article.headline,
    '',
    '# BLURB',
    article.blurb,
    '',
    '# BODY',
    article.body,
    '',
  ].join('\n');
}

function editableToArticle(text) {
  const sections = { headline: [], blurb: [], body: [] };
  const markerToKey = {
    '# HEADLINE': 'headline',
    '# BLURB': 'blurb',
    '# BODY': 'body',
  };
  let current = null;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (markerToKey[trimmed]) {
      current = markerToKey[trimmed];
      continue;
    }
    // Skip instruction headers and ";" comment lines
    if (trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    if (current) sections[current].push(line);
  }
  const collapse = lines => lines.join('\n').trim();
  return {
    headline: collapse(sections.headline),
    blurb: collapse(sections.blurb),
    body: collapse(sections.body),
  };
}

// Open the generated article in the user's editor and return the edited version.
// Returns the original article unchanged if the editor can't be launched.
async function editArticleInEditor(article) {
  const tmpFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'golf-report-')),
    'report.md',
  );
  fs.writeFileSync(tmpFile, articleToEditable(article));

  const editor = process.env.VISUAL || process.env.EDITOR || 'vim';
  // Editor command may contain arguments (e.g. "code --wait")
  const [cmd, ...args] = editor.split(/\s+/);
  const result = spawnSync(cmd, [...args, tmpFile], { stdio: 'inherit' });

  if (result.error) {
    console.warn(
      `\nCould not open editor "${editor}" (${result.error.message}). Using the article as generated.`,
    );
    return article;
  }
  if (result.status !== 0) {
    console.warn(
      `\nEditor exited with status ${result.status}. Using the article as generated.`,
    );
    return article;
  }

  const edited = editableToArticle(fs.readFileSync(tmpFile, 'utf8'));
  fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true });

  if (!edited.headline || !edited.blurb || !edited.body) {
    console.warn(
      '\nEdited report is missing a headline, blurb, or body. Using the article as generated.',
    );
    return article;
  }
  return edited;
}

// Match play competitions have no leaderboard/cut/scores, so they use the
// bracket data instead. Builds and saves a report for a completed knockout.
async function writeMatchPlayReport({
  competition,
  playerSlugs,
  existingHeadlines,
  statusText,
}) {
  console.log('Fetching match play bracket from GolfBox API...');
  const matchplay = await fetchMatchplay(competition.id);
  if (!matchplay) {
    console.error(
      'No completed match play final found for this competition — cannot write a report yet.',
    );
    process.exit(1);
  }

  const { champion, finalist, finalResult, semifinalists, championPath, fieldSize } =
    matchplay;

  const toEntry = (player, position) => ({
    position,
    name: player.name,
    club: player.club,
    playerId: player.memberId,
    playerSlug: playerSlugs[player.memberId] || null,
    score: null,
    // Show the winning margin in the champion's "Score" cell; blank for others.
    scoreText: position === '1' ? finalResult : '',
  });
  const topFinishers = [
    toEntry(champion, '1'),
    toEntry(finalist, '2'),
    ...semifinalists.map(s => toEntry(s, 'T3')),
  ];
  const winner = topFinishers[0];

  // Build player links for everyone in the bracket that we have a slug for.
  const playerLinksMap = new Map();
  const normalizeName = name =>
    name.replace(/\s*\(a\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  for (const round of matchplay.rounds) {
    for (const m of round.matches) {
      for (const player of [m.winner, m.loser]) {
        const slug = playerSlugs[player.memberId];
        if (slug) playerLinksMap.set(normalizeName(player.name), slug);
      }
    }
  }
  const playerLinksText = [...playerLinksMap.entries()]
    .map(([name, slug]) => `  - [${name}](/${slug})`)
    .join('\n');

  const winnerImage = findWinnerImage(champion.memberId);

  console.log('\nTournament data (match play):');
  console.log(`  Champion: ${champion.name}`);
  console.log(`  Final: beat ${finalist.name} ${finalResult}`);
  console.log(
    `  Semi-finalists: ${semifinalists.map(s => s.name).join(', ') || 'n/a'}`,
  );
  console.log(`  Field size: ${fieldSize ?? 'unknown'}`);
  console.log(`  Winner image: ${winnerImage || 'none'}`);

  const matchData = {
    name: competition.name,
    venue: competition.venue,
    startDate: format(competition.start, 'MMMM d, yyyy'),
    endDate: format(competition.end, 'MMMM d, yyyy'),
    champion,
    finalist,
    finalResult,
    semifinalists,
    championPath,
    fieldSize,
    existingHeadlines,
    statusText,
  };

  const extraContext = await promptUser(
    '\nAny additional context for the article? (press Enter to skip)\n> ',
  );

  console.log('\nCalling Anthropic API...');
  const generated = await callAnthropicAPIMatchPlay(
    matchData,
    playerLinksText,
    extraContext,
  );

  console.log(`\nHeadline: ${generated.headline}`);
  console.log(`Blurb: ${generated.blurb}`);

  const editAnswer = await promptUser(
    '\nEdit the article in your editor before saving? (Y/n) ',
    'n',
  );
  const article =
    editAnswer.toLowerCase() === 'n'
      ? generated
      : await editArticleInEditor(generated);

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
    winnerName: winner.name,
    winnerPlayerId: winner.playerId,
    winnerPlayerSlug: winner.playerSlug,
    winnerImage,
    format: 'matchplay',
    stats: {
      format: 'matchplay',
      finalResult,
      winningScore: null,
      winningScoreText: null,
      totalPlayers: fieldSize,
      playersMadeCut: null,
      playersMissedCut: null,
      cutScore: null,
      cutScoreText: null,
      marginOfVictory: null,
      topFinishers,
    },
    createdAt: new Date().toISOString(),
  };

  const reportPath = path.join(REPORTS_DIR, `${competition.slug}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

// Team stroke-play competitions rank teams (usually pairs) by their combined
// score. There is no cut and no single winning player, so the report leans on
// the team standings rather than the individual leaderboard.
async function writeTeamReport({
  competition,
  teams,
  playerSlugs,
  existingHeadlines,
  statusText,
}) {
  // GolfBox uses sentinel values (e.g. 40000/50000) for withdrawn teams.
  const isValidScore = t => Math.abs(t.score) < 1000;
  const finishers = teams.filter(
    t => t.positionActual != null && isValidScore(t),
  );
  finishers.sort((a, b) => {
    if (a.positionActual !== b.positionActual)
      return a.positionActual - b.positionActual;
    return a.score - b.score;
  });

  // Collapse duplicate clubs so a same-club pair shows one club, mixed pairs both.
  const uniqueClubs = members => {
    const seen = [];
    for (const m of members) {
      if (m.clubName && !seen.includes(m.clubName)) seen.push(m.clubName);
    }
    return seen.join(' / ');
  };

  const topFinishers = finishers.slice(0, 5).map(t => ({
    position: t.position,
    name: t.name,
    club: uniqueClubs(t.members),
    score: t.score,
    scoreText: t.scoreText,
    // A team has no single player page, so the results table shows it unlinked.
    playerSlug: null,
    players: t.members.map(m => ({
      name: `${m.firstName} ${m.lastName}`.trim(),
      playerId: m.memberId,
      playerSlug: playerSlugs[m.memberId] || null,
    })),
  }));

  const winner = topFinishers[0];
  const runnerUp = topFinishers[1];
  const marginOfVictory =
    winner && runnerUp ? runnerUp.score - winner.score : null;
  // A zero margin means the leading teams finished level and the title was
  // decided by a play-off or countback — flag it so the article doesn't claim
  // a "0 shot" win.
  const tiedAtTop = winner && runnerUp && winner.score === runnerUp.score;

  // Build player links for the members of the leading teams.
  const playerLinksMap = new Map();
  const normalizeName = name =>
    name.replace(/\s*\(a\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  for (const t of finishers.slice(0, 10)) {
    for (const m of t.members) {
      const slug = playerSlugs[m.memberId];
      if (slug) playerLinksMap.set(normalizeName(`${m.firstName} ${m.lastName}`), slug);
    }
  }
  const playerLinksText = [...playerLinksMap.entries()]
    .map(([name, slug]) => `  - [${name}](/${slug})`)
    .join('\n');

  const teamData = {
    name: competition.name,
    venue: competition.venue,
    startDate: format(competition.start, 'MMMM d, yyyy'),
    endDate: format(competition.end, 'MMMM d, yyyy'),
    totalTeams: teams.length,
    topFinishers,
    marginOfVictory,
    tiedAtTop,
    winnerName: winner?.name,
    runnerUpName: runnerUp?.name,
    topScoreText: winner?.scoreText,
    existingHeadlines,
    statusText,
  };

  console.log('\nTournament data (team):');
  console.log(`  Winner: ${winner?.name} (${winner?.scoreText})`);
  console.log(`  Runner-up: ${runnerUp?.name} (${runnerUp?.scoreText})`);
  console.log(`  Margin: ${marginOfVictory} shots`);
  console.log(`  Field: ${teams.length} teams`);

  const extraContext = await promptUser(
    '\nAny additional context for the article? (press Enter to skip)\n> ',
  );

  console.log('\nCalling Anthropic API...');
  const generated = await callAnthropicAPITeam(
    teamData,
    playerLinksText,
    extraContext,
  );

  console.log(`\nHeadline: ${generated.headline}`);
  console.log(`Blurb: ${generated.blurb}`);

  const editAnswer = await promptUser(
    '\nEdit the article in your editor before saving? (Y/n) ',
    'n',
  );
  const article =
    editAnswer.toLowerCase() === 'n'
      ? generated
      : await editArticleInEditor(generated);

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
    // A team has two players, so there is no single winner photo/profile.
    winnerName: winner?.name || null,
    winnerPlayerId: null,
    winnerPlayerSlug: null,
    winnerImage: null,
    format: 'team',
    stats: {
      format: 'team',
      winningScore: winner?.score ?? null,
      winningScoreText: winner?.scoreText || null,
      totalPlayers: teams.length,
      playersMadeCut: null,
      playersMissedCut: null,
      cutScore: null,
      cutScoreText: null,
      marginOfVictory,
      topFinishers,
    },
    createdAt: new Date().toISOString(),
  };

  const reportPath = path.join(REPORTS_DIR, `${competition.slug}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
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

  if (args.includes('--missing')) {
    const missing = competitions.filter(c => !existingReportIds.has(c.id));
    missing.forEach(c => console.log(c.slug));
    process.exit(0);
  }

  let competition;
  const slugArg = args.find(a => !a.startsWith('--'));
  if (slugArg) {
    competition = competitions.find(c => c.slug === slugArg);
    if (!competition) {
      console.error(`No competition found with slug: ${slugArg}`);
      process.exit(1);
    }
  } else {
    console.log('\nSelect a competition:\n');
    competitions.forEach((c, i) => {
      const tag = existingReportIds.has(c.id) ? ' [report exists]' : '';
      console.log(`  ${i + 1}. ${c.name} (${format(c.end, 'MMM d')})${tag}`);
    });

    if (NON_INTERACTIVE) {
      console.error('Pass a competition slug when running non-interactively.');
      process.exit(1);
    }
    const answer = await promptUser('\nEnter number: ');
    const idx = parseInt(answer, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= competitions.length) {
      console.error('Invalid selection.');
      process.exit(1);
    }

    competition = competitions[idx];
  }
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
  const { entries, teams, statusText, type } = await fetchLeaderboard(
    competition.id,
  );

  // Match play tournaments have no stroke-play leaderboard; report on the
  // knockout bracket instead.
  if (type === 'MatchPlay') {
    await writeMatchPlayReport({
      competition,
      playerSlugs,
      existingHeadlines,
      statusText,
    });
    return;
  }

  // Team competitions rank teams rather than individuals; the individual
  // `entries` list is empty, so report on the team standings instead.
  if (teams.length > 0) {
    await writeTeamReport({
      competition,
      teams,
      playerSlugs,
      existingHeadlines,
      statusText,
    });
    return;
  }

  console.log(`  Got ${entries.length} entries`);

  const EXTRAORDINARY_ROUND_THRESHOLD = 63;

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

  // Detect a play-off. Two signals:
  // 1. StatusText from GolfBox explicitly mentions "Play-Off" (with hole detail).
  // 2. Winner and runner-up share the same score but hold positions 1 and 2 —
  //    GolfBox never shows T1 when a play-off split the tie.
  let playOffText = null;
  if (statusText && /play.?off/i.test(statusText)) {
    playOffText = statusText;
  } else if (winner && runnerUp && winner.score === runnerUp.score) {
    playOffText = `${winner.name} won via a play-off against ${runnerUp.name} after both finished tied at ${winner.scoreText}.`;
  }
  if (playOffText) {
    console.log(`  Play-off detected: ${playOffText}`);
  }

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

  // Find extraordinary rounds (gross score ≤ 63)
  const extraordinaryRounds = entries
    .flatMap(e =>
      (e.rounds || [])
        .filter(r => r.grossScore <= EXTRAORDINARY_ROUND_THRESHOLD)
        .map(r => ({
          playerName: `${e.firstName} ${e.lastName}`,
          roundNumber: r.roundNumber,
          grossScore: r.grossScore,
        })),
    )
    .sort((a, b) => a.grossScore - b.grossScore);

  if (extraordinaryRounds.length > 0) {
    console.log(
      `  Extraordinary rounds (≤${EXTRAORDINARY_ROUND_THRESHOLD}): ${extraordinaryRounds
        .map(r => `${r.playerName} R${r.roundNumber}: ${r.grossScore}`)
        .join(', ')}`,
    );
  }

  // Build player links for the article (top 15 finishers + extraordinary round players)
  const playerLinksMap = new Map();
  const normalizeName = name =>
    name.replace(/\s*\(a\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  for (const f of finishers.slice(0, 15)) {
    const slug = playerSlugs[f.memberId];
    if (slug) playerLinksMap.set(normalizeName(`${f.firstName} ${f.lastName}`), slug);
  }
  for (const e of entries) {
    if ((e.rounds || []).some(r => r.grossScore <= EXTRAORDINARY_ROUND_THRESHOLD)) {
      const slug = playerSlugs[e.memberId];
      if (slug) playerLinksMap.set(normalizeName(`${e.firstName} ${e.lastName}`), slug);
    }
  }
  const playerLinksText = [...playerLinksMap.entries()]
    .map(([name, slug]) => `  - [${name}](/${slug})`)
    .join('\n');

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
    extraordinaryRounds,
    playOffText,
    statusText,
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

  const extraContext = await promptUser(
    '\nAny additional context for the article? (press Enter to skip)\n> ',
  );

  console.log('\nCalling Anthropic API...');
  const generated = await callAnthropicAPI(tournamentData, playerLinksText, extraContext);

  console.log(`\nHeadline: ${generated.headline}`);
  console.log(`Blurb: ${generated.blurb}`);

  const editAnswer = await promptUser(
    '\nEdit the article in your editor before saving? (Y/n) ',
    'n',
  );
  const article =
    editAnswer.toLowerCase() === 'n'
      ? generated
      : await editArticleInEditor(generated);

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
