import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import Menu from '../../src/Menu';
import ReportBlurbs from '../../src/ReportBlurbs';

export default function ReportsIndexPage({ reports }) {
  return (
    <div className="chrome">
      <Head>
        <title>{`Tournament Reports | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}</title>
        <meta name="description" content={`Tournament reports and results from ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`} />
        <meta property="og:title" content={`Tournament Reports | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta property="og:description" content={`Tournament reports and results from ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={`Tournament Reports | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta name="twitter:description" content={`Tournament reports and results from ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`} />
      </Head>
      <Menu />
      <div className="reports-index-page">
        <ReportBlurbs reports={reports} />
        <p className="report-footer">
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const reportsDir = path.join(process.cwd(), 'src', 'reports');
  let reports = [];
  if (fs.existsSync(reportsDir)) {
    reports = fs
      .readdirSync(reportsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
      .map(a => ({
        slug: a.slug,
        competitionName: a.competitionName,
        endDate: a.endDate,
        headline: a.headline,
        blurb: a.blurb,
        winnerName: a.winnerName || null,
        winnerPlayerId: a.winnerPlayerId || null,
        winnerImage: a.winnerImage || null,
      }));
  }
  return { props: { reports } };
}
