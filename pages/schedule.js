import { format, startOfDay, startOfYear } from 'date-fns';
import Link from 'next/link';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';

import Menu from '../src/Menu';
import ensureDates from '../src/ensureDates.js';
import prisma from '../src/prisma';
import locations from '../src/locations.json';

export default function SchedulePage({ competitions, now: nowMs }) {
  competitions.forEach(ensureDates);
  const now = startOfDay(new Date(nowMs));
  const currentCompetition = competitions.find(
    c => c.start <= now && c.end >= now,
  );
  const [TourMap, setTourMap] = useState(null);
  useEffect(() => {
    import('../src/TourMap').then(m => setTourMap(() => m.default));
  }, []);

  return (
    <div className="chrome">
      <Head>
        <title>Schedule</title>
        <meta
          name="description"
          content={`Full schedule for the ${new Date().getFullYear()} season of ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`}
        />
      </Head>
      <Menu activeHref="/schedule" />
      <div className="schedule">
        <h2>Tour schedule</h2>
        <div className="tour-map-wrapper">
          {TourMap && (
            <TourMap competitions={competitions} locations={locations} now={now} />
          )}
        </div>
        <table className="results-table page-margin">
          <thead>
            <tr>
              <th>Event</th>
              <th>Dates</th>
            </tr>
          </thead>
          {competitions.length > 0 && (
            <tbody>
              {competitions.map(c => (
                <CompetitionItem
                  key={c.id}
                  competition={c}
                  now={now}
                  current={currentCompetition && currentCompetition.id === c.id}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

function CompetitionItem({ competition, now, current }) {
  const queryString = now > competition.end ? '?finished=1' : '';
  const past = !current && now > competition.end;
  return (
    <tr
      key={competition.id}
      className={[
        'competition-list-item',
        current ? 'current' : '',
        past ? 'past' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td>
        <Link href={`/t/${competition.slug}${queryString}`}>
          {competition.name}
          <br />
        </Link>
        <span className="schedule-venue">{competition.venue}</span>
      </td>
      <td>
        {format(competition.start, 'MMM d')} —{' '}
        {format(competition.end, 'MMM d')}
      </td>
    </tr>
  );
}

export async function getServerSideProps() {
  const now = Date.now();
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'asc' },
    where: { visible: true, start: { gte: startOfYear(new Date(now)) } },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
    },
  });
  for (const c of competitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
  }
  return { props: { competitions, now } };
}
