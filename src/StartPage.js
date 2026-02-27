import { format } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import ReportBlurbs from './ReportBlurbs.js';
import Leaderboard from './Leaderboard.js';
import Menu from './Menu';
import competitionDateString from './competitionDateString';
import ensureDates from './ensureDates.js';

const youtubers = [
  {
    name: 'Stefan Idstam',
    url: 'https://www.youtube.com/@stefanidstamgolf',
    avatar: {
      url: '/avatar-stefan-idstam.jpg',
      width: 320,
      height: 320,
    },
  },
  {
    name: 'Adam Andersson',
    url: 'https://adamanderssongolf.com/',
    avatar: {
      url: 'https://adamanderssongolf.com/wp-content/uploads/sb-instagram-feed-images/517973384_18507897097053711_8842400633805056808_nfull.webp',
      width: 640,
      height: 843,
    },
  },
];

export default function StartPage({
  pastCompetitions,
  upcomingCompetitions,
  nextCompetition,
  currentCompetition,
  reports,
  now: nowMs,
}) {
  pastCompetitions.forEach(ensureDates);
  upcomingCompetitions.forEach(ensureDates);
  if (nextCompetition) {
    ensureDates(nextCompetition);
  }
  if (currentCompetition) {
    ensureDates(currentCompetition);
  }
  const now = new Date(nowMs);

  return (
    <div className="chrome">
      <Head>
        <meta
          name="description"
          content={`
${process.env.NEXT_PUBLIC_INTRO}. Follow your favorite players and get the latest updates straight in your inbox.
        `.trim()}
        />
      </Head>
      <Menu />
      <div className="competitions">
        <h2>{process.env.NEXT_PUBLIC_INTRO_TITLE}</h2>
        <p className="page-desc">
          {process.env.NEXT_PUBLIC_INTRO} Follow your{' '}
          <Link href="/players">favorite players</Link>{' '}
          and get the latest updates{' '}
          <Link href="/profile">straight in your inbox</Link>
          .
        </p>
        {currentCompetition && (
          <Leaderboard competition={currentCompetition} now={now} />
        )}
        {nextCompetition ? (
          <ul>
            <CompetitionListItem competition={nextCompetition} now={now} next />
          </ul>
        ) : null}
        {reports && reports.length > 0 && (
          <ReportBlurbs reports={reports} />
        )}
        {upcomingCompetitions.length > 0 && (
          <>
            <h3>Future events</h3>
            <ul>
              {upcomingCompetitions.map(c => (
                <CompetitionListItem key={c.id} competition={c} now={now} />
              ))}
            </ul>
            <Link href="/schedule" className="page-margin competition-view-all">
              View all events
            </Link>
          </>
        )}

        <h3 style={{ marginBottom: 0 }}>More from the players</h3>
        <p className="page-desc">
          Support players by following them on their social media accounts,
          subscribing to their channels and watching their videos.
        </p>
        <ul className="youtubers">
          {youtubers.map(y => (
            <li key={y.name} className="youtuber">
              <a
                href={y.url}
                className="youtuber-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={y.avatar.url}
                  alt={y.name}
                  width={y.avatar.width}
                  height={y.avatar.height}
                />
                {y.name}
              </a>
            </li>
          ))}
        </ul>

        {pastCompetitions.length > 0 && (
          <>
            <h3>Past events</h3>
            <ul>
              {pastCompetitions.map(c => (
                <CompetitionListItem key={c.id} competition={c} now={now} />
              ))}
            </ul>
            <Link href="/schedule" className="page-margin competition-view-all">
              View all events
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function CompetitionListItem({ competition, now, current, next }) {
  const queryString = now > competition.end ? '?finished=1' : '';
  const classNames = ['competition-list-item'];
  if (current) classNames.push('current');
  if (next) classNames.push('next');
  return (
    <li
      key={competition.id}
      className={classNames.join(' ')}
    >
      <Link href={`/t/${competition.slug}${queryString}`} className="competition">
        <div className="calendar-event">
          <b>{format(competition.start, 'd')}</b>
          <span>{format(competition.start, 'MMM')}</span>
        </div>
        <div className="competition-details">
          <h4 className="competition-name">
            <span>{competition.name}</span>
          </h4>
          <p>
            {competition.venue} — {competitionDateString(competition, now)}
          </p>
        </div>
      </Link>
    </li>
  );
}
