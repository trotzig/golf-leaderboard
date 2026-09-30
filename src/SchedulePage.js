import { format, startOfDay } from 'date-fns';
import Link from 'next/link';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';

import ensureDates from './ensureDates.js';
import formatCompetitionName from './formatCompetitionName';
import getCompetitionTour from './getCompetitionTour.mjs';
import locations from './locations.json';

export default function SchedulePage({
  competitions,
  years,
  selectedYear,
  now: nowMs,
  showMap = true,
}) {
  competitions.forEach(ensureDates);
  const now = startOfDay(new Date(nowMs));
  const currentCompetition = competitions.find(
    c => c.start <= now && c.end >= now,
  );
  const [TourMap, setTourMap] = useState(null);
  useEffect(() => {
    if (!showMap) {
      return;
    }
    import('./TourMap').then(m => setTourMap(() => m.default));
  }, [showMap]);

  return (
    <div className="chrome">
      <Head>
        <title>{`Tour schedule ${selectedYear} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`}</title>
        <meta
          name="description"
          content={`Full schedule for the ${selectedYear} season of ${
            process.env.NEXT_PUBLIC_INTRO_TITLE
          }.`}
        />
        <meta property="og:title" content={`Tour schedule ${selectedYear} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta
          property="og:description"
          content={`Full schedule for the ${selectedYear} season of ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={`Tour schedule ${selectedYear} | ${process.env.NEXT_PUBLIC_INTRO_TITLE}`} />
        <meta
          name="twitter:description"
          content={`Full schedule for the ${selectedYear} season of ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`}
        />
      </Head>
      <div className="schedule">
        <h2>Tour schedule</h2>
        <div className="tour-map-wrapper">
          {TourMap && (
            <TourMap
              competitions={competitions}
              locations={locations}
              now={now}
            />
          )}
        </div>
        {years.length > 1 && (
          <div className="page-margin">
            <ul className="tabs">
              {years.map(year => (
                <li
                  key={year}
                  className={selectedYear === year ? 'tab-selected' : ''}
                >
                  <Link href={`/schedule?year=${year}`}>{year}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <table className="results-table page-margin">

          {competitions.length > 0 && (
            <tbody>
              {competitions.flatMap((c, i) => {
                const month = format(new Date(c.start), 'MMMM');
                const prevMonth =
                  i > 0 ? format(new Date(competitions[i - 1].start), 'MMMM') : null;
                const rows = [];
                if (month !== prevMonth) {
                  rows.push(
                    <tr key={`month-${month}`} className="schedule-month-header">
                      <td colSpan={2}>{month}</td>
                    </tr>,
                  );
                }
                rows.push(
                  <CompetitionItem
                    key={c.id}
                    competition={c}
                    now={now}
                    current={currentCompetition && currentCompetition.id === c.id}
                    previousYear={selectedYear < new Date(nowMs).getFullYear()}
                  />,
                );
                return rows;
              })}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

function CompetitionItem({ competition, now, current, previousYear }) {
  const queryString = now > competition.end ? '?finished=1' : '';
  const past = !current && now > competition.end;
  const tour = getCompetitionTour(competition.categories);
  return (
    <tr
      key={competition.id}
      className={[
        'competition-list-item',
        current ? 'current' : '',
        past ? 'past' : '',
        previousYear ? 'previous-year' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td>
        <Link href={`/t/${competition.slug}${queryString}`}>
          {formatCompetitionName(competition.name)}
          <br />
        </Link>
        {tour && <span className="schedule-tour">{tour}</span>}
        <span className="schedule-venue">{competition.venue}</span>
      </td>
      <td>
        {format(competition.start, 'MMM d')} —{' '}
        {format(competition.end, 'MMM d')}
      </td>
    </tr>
  );
}
