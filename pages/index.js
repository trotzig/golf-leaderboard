import { startOfDay, format } from 'date-fns';
import Link from 'next/link';
import React, { useEffect } from 'react';

import Menu from '../src/Menu';
import competitionDateString from '../src/competitionDateString';
import ensureDates from '../src/ensureDates.js';
import prisma from '../src/prisma';

export default function StartPage({ competitions }) {
  competitions.forEach(ensureDates);
  const now = startOfDay(new Date());
  const pastCompetitions = competitions.filter(c => c.end < now);
  const currentCompetitions = competitions.filter(
    c => c.start <= now && c.end >= now,
  );

  const upcomingCompetitions = competitions.filter(c => now < c.start);
  const nextCompetition =
    currentCompetitions.length === 0 ? upcomingCompetitions[0] : undefined;

  if (nextCompetition) {
    upcomingCompetitions.shift();
  }

  return (
    <div className="chrome">
      <Menu
        defaultCompetitionId={
          currentCompetitions.length > 0 ? currentCompetitions[0].id : undefined
        }
      />
      <div className="competitions">
        <h2>MoreGolf Mastercard Tour</h2>
        <p className="competitions-desc">
          <a href="https://www.nordicgolftour.app">Nordicgolftour.app</a> is the
          unofficial home of the Nordic professional golf tour for men, known as
          MoreGolf Mastercard Tour. Follow your{' '}
          <Link href="/players">
            <a>favorite players</a>
          </Link>{' '}
          and get the latest updates{' '}
          <Link href="/profile">
            <a>straight in your inbox</a>
          </Link>
          .
        </p>
        {currentCompetitions.length > 0 && (
          <>
            <h3>Current event</h3>
            <ul>
              {currentCompetitions.map(c => (
                <CompetitionListItem
                  key={c.id}
                  competition={c}
                  now={now}
                  current
                />
              ))}
            </ul>
          </>
        )}
        {nextCompetition ? (
          <>
            <h3>Next event</h3>
            <ul>
              <CompetitionListItem competition={nextCompetition} now={now} />
            </ul>
          </>
        ) : null}
        {upcomingCompetitions.length > 0 && (
          <>
            <h3>Future events</h3>
            <ul>
              {upcomingCompetitions.slice(0, 3).map(c => (
                <CompetitionListItem key={c.id} competition={c} now={now} />
              ))}
            </ul>
            <Link href="/schedule">
              <a className="page-margin competition-view-all">
                View all events
              </a>
            </Link>
          </>
        )}
        {pastCompetitions.length > 0 && (
          <>
            <h3>Past events</h3>
            <ul>
              {pastCompetitions
                .reverse()
                .slice(0, 3)
                .map(c => (
                  <CompetitionListItem key={c.id} competition={c} now={now} />
                ))}
            </ul>
            <Link href="/schedule">
              <a className="page-margin competition-view-all">
                View all events
              </a>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function CompetitionListItem({ competition, now, current }) {
  const queryString = now > competition.end ? '?finished=1' : '';
  return (
    <li
      key={competition.id}
      className={
        current ? 'competition-list-item current' : 'competition-list-item'
      }
    >
      <Link href={`/competitions/${competition.id}${queryString}`}>
        <a className="competition">
          <div className="calendar-event">
            <b>{format(competition.start, 'd')}</b>
            <span>{format(competition.start, 'MMM')}</span>
          </div>
          <div>
            <h4>
              <span>{competition.name}</span>
            </h4>
            <p>
              {competition.venue} — {competitionDateString(competition, now)}
            </p>
          </div>
        </a>
      </Link>
    </li>
  );
}

export async function getServerSideProps() {
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'desc' },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
    },
  });
  for (const c of competitions) {
    c.start = c.start.getTime();
    c.end = c.end.getTime();
  }
  return { props: { competitions }};
}
