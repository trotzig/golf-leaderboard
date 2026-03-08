import { format } from 'date-fns';
import Link from 'next/link';
import React from 'react';
import PlayerPhoto from './PlayerPhoto';

export default function ReportBlurbs({ reports, showViewAll }) {
  if (!reports || reports.length === 0) return null;

  return (
    <section className="report-blurbs-section">
      <h3>Tournament feed</h3>
      <ul className="report-blurbs">
        {reports.map(report => (
          <li key={report.slug} className="report-blurb">
            <Link href={`/reports/${report.slug}`} className="report-blurb-link">
              {report.isSeriesReport ? (
                <div className="report-blurb-image-wrap report-blurb-series-icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="report-series-icon">
                    <path d="M5 3V19H21V21H3V3H5ZM20.2929 6.29289L21.7071 7.70711L16 13.4142L13 10.415L8.70711 14.7071L7.29289 13.2929L13 7.58579L16 10.585L20.2929 6.29289Z" />
                  </svg>
                </div>
              ) : report.winnerImage && report.winnerPlayerId && (
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
                  {!report.isSeriesReport && (
                    <>
                      {report.competitionName}
                      {' · '}
                    </>
                  )}
                  {format(new Date(report.endDate), 'MMM yyyy')}
                </p>
                <h4 className="report-blurb-headline">{report.headline}</h4>
                <p className="report-blurb-text">{report.blurb}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {showViewAll && (
        <Link href="/reports" className="page-margin competition-view-all">
          View all reports
        </Link>
      )}
    </section>
  );
}
