import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { format } from 'date-fns';

import Menu from '../../src/Menu';
import PlayerPhoto from '../../src/PlayerPhoto';

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
      <Menu />
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

        {report.winnerImage && report.winnerPlayerId && (
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
            <p key={i}>{p}</p>
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
