import { format } from 'date-fns';
import Link from 'next/link';
import React from 'react';
import PlayerPhoto from './PlayerPhoto';

export default function ReportBlurbs({ reports }) {
  if (!reports || reports.length === 0) return null;

  return (
    <section className="report-blurbs-section">
      <h3>Tournament reports</h3>
      <ul className="report-blurbs">
        {reports.map(report => (
          <li key={report.slug} className="report-blurb">
            <Link href={`/reports/${report.slug}`} className="report-blurb-link">
              {report.winnerImage && report.winnerPlayerId && (
                <div className="report-blurb-image-wrap">
                  <PlayerPhoto
                    player={{
                      id: report.winnerPlayerId,
                      firstName: report.winnerName || '',
                      lastName: '',
                    }}
                  />
                </div>
              )}
              <div className="report-blurb-content">
                <p className="report-blurb-meta">
                  {report.competitionName}
                  {' · '}
                  {format(new Date(report.endDate), 'MMM yyyy')}
                </p>
                <h4 className="report-blurb-headline">{report.headline}</h4>
                <p className="report-blurb-text">{report.blurb}</p>
                <span className="report-blurb-read-more">Read report</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
