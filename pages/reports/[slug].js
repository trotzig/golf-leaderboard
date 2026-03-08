import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { format } from 'date-fns';

import PlayerPhoto from '../../src/PlayerPhoto';

// Parse markdown links ([text](href)) in a paragraph into renderable segments
function parseParagraph(text) {
  const segments = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), href: null });
    segments.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), href: null });
  return segments;
}

export default function ReportPage({ report, baseUrl }) {
  const paragraphs = report.body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const endDate = new Date(report.endDate);

  return (
    <div className="chrome">
      <Head>
        <title>{`${report.headline} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}</title>
        <meta name="description" content={report.blurb} />
        <meta property="og:title" content={`${report.headline} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta property="og:description" content={report.blurb} />
        <meta property="og:type" content="article" />
        {report.winnerPlayerId && baseUrl && (
          <meta property="og:image" content={`${baseUrl}/players/${report.winnerPlayerId}.jpg`} />
        )}
        <meta name="twitter:card" content={report.winnerPlayerId && baseUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={`${report.headline} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta name="twitter:description" content={report.blurb} />
        {report.winnerPlayerId && baseUrl && (
          <meta name="twitter:image" content={`${baseUrl}/players/${report.winnerPlayerId}.jpg`} />
        )}
      </Head>
      <article className="report-page">
        <header className="report-header">
          <p className="report-meta">
            <Link href={`/t/${report.competitionSlug}`}>
              {report.competitionName}
            </Link>
            {report.venue ? ` — ${report.venue}` : ''}
            {' · '}
            {format(endDate, 'MMMM d, yyyy')}
          </p>
          <h1 className="report-headline">{report.headline}</h1>
          <p className="report-lead">{report.blurb}</p>
        </header>

        {report.isSeriesReport ? (
          <div className="report-series-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="report-series-icon">
              <path d="M5 3V19H21V21H3V3H5ZM20.2929 6.29289L21.7071 7.70711L16 13.4142L13 10.415L8.70711 14.7071L7.29289 13.2929L13 7.58579L16 10.585L20.2929 6.29289Z" />
            </svg>
          </div>
        ) : report.winnerImage && report.winnerPlayerId && (
          <div className="report-winner-image-wrap">
            <PlayerPhoto
              player={{
                id: report.winnerPlayerId,
                firstName: report.winnerName || '',
                lastName: '',
              }}
            />
            {report.winnerName && (
              <p className="report-winner-caption">{report.winnerName}</p>
            )}
          </div>
        )}

        <div className="report-body">
          {paragraphs.map((p, i) => (
            <p key={i}>
              {parseParagraph(p).map((seg, j) =>
                seg.href ? (
                  <Link key={j} href={seg.href} className="report-player-link">{seg.text}</Link>
                ) : seg.text
              )}
            </p>
          ))}
        </div>

        {report.stats?.topFinishers?.length > 0 && (
          <aside className="report-results">
            <h2 className="report-results-heading">Final results</h2>
            <table className="report-results-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {report.stats.topFinishers.map((f, i) => (
                  <tr key={i}>
                    <td>{f.position}</td>
                    <td>
                      {f.playerSlug ? (
                        <Link href={`/${f.playerSlug}`}>{f.name}</Link>
                      ) : (
                        f.name
                      )}
                      {f.club && (
                        <div className="report-results-club">{f.club}</div>
                      )}
                    </td>
                    <td
                      className={
                        f.score < 0 ? 'report-results-score under-par' : 'report-results-score'
                      }
                    >
                      {f.scoreText === 'E' || f.scoreText === 'Par'
                        ? 'E'
                        : f.scoreText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="report-results-stats">
              {report.stats.playersMadeCut != null && report.stats.totalPlayers != null && (
                <span>
                  {report.stats.playersMadeCut} of {report.stats.totalPlayers} players made the cut
                </span>
              )}
              {report.stats.cutScore != null && (
                <span>
                  {' · '}Cut:{' '}
                  {report.stats.cutScore === 0
                    ? 'E'
                    : report.stats.cutScore < 0
                    ? report.stats.cutScore
                    : `+${report.stats.cutScore}`}
                </span>
              )}
              {' · '}
              <Link href={`/t/${report.competitionSlug}`} className="report-results-all">
                View all scores →
              </Link>
            </div>
          </aside>
        )}

        {report.stats?.topBirdies?.length > 0 && (
          <aside className="report-results">
            <h2 className="report-results-heading">Most birdies or better</h2>
            <table className="report-results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Birdies</th>
                </tr>
              </thead>
              <tbody>
                {report.stats.topBirdies.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {p.playerSlug ? (
                        <Link href={`/${p.playerSlug}`}>{p.name}</Link>
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="report-results-score">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>
        )}

        {report.stats?.holeInOnes?.length > 0 && (
          <aside className="report-results">
            <h2 className="report-results-heading">Hole-in-ones</h2>
            <table className="report-results-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Hole</th>
                  <th>Venue</th>
                </tr>
              </thead>
              <tbody>
                {report.stats.holeInOnes.map((h, i) => (
                  <tr key={i}>
                    <td>
                      {h.playerSlug ? (
                        <Link href={`/${h.playerSlug}`}>{h.name}</Link>
                      ) : (
                        h.name
                      )}
                    </td>
                    <td className="report-results-score">{h.hole}</td>
                    <td>{h.venue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>
        )}

        <p className="report-ai-note">
          This report was written with the help of an{' '}
          <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer">
            Anthropic
          </a>{' '}
          LLM.
        </p>
        <p className="report-footer">
          <Link href="/">← Back to home</Link>
        </p>
      </article>
    </div>
  );
}

export async function getServerSideProps({ params, req }) {
  const reportsDir = path.join(process.cwd(), 'src', 'reports');
  const filePath = path.join(reportsDir, `${params.slug}.json`);

  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }

  const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${req.headers.host}`;
  return { props: { report, baseUrl } };
}
