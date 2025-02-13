import { format, startOfDay, startOfYear } from 'date-fns';
import Link from 'next/link';
import Head from 'next/head';
import React from 'react';

import Menu from '../src/Menu';
import ensureDates from '../src/ensureDates.js';
import prisma from '../src/prisma';

export default function SchedulePage({ competitions }) {
  competitions.forEach(ensureDates);
  const now = startOfDay(new Date());
  const currentCompetition = competitions.find(
    c => c.start <= now && c.end >= now,
  );

  return (
    <div className="chrome">
      <Head>
        <title>Schedule</title>
        <meta
          name="description"
          content={`Full schedule for the 2025 season of ${process.env.NEXT_PUBLIC_INTRO_TITLE}.`}
        />
      </Head>
      <Menu activeHref="/schedule" />
      <div className="schedule">
        <h2>Tour schedule</h2>
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
                <CompetitionItem key={c.id} competition={c} now={now} />
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
  return (
    <tr
      key={competition.id}
      className={
        current ? 'competition-list-item current' : 'competition-list-item'
      }
    >
      <td>
        <Link href={`/t/${competition.slug}${queryString}`}>
          <a>
            {competition.name}
            <br />
          </a>
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
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'asc' },
    where: { visible: true, start: { gte: startOfYear(new Date()) } },
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
  return { props: { competitions } };
}
