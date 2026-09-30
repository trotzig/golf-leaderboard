import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import ReportBlurbs from './ReportBlurbs';

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
      <div className="reports-index-page">
        <ReportBlurbs reports={reports} />
        <p className="report-footer">
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
