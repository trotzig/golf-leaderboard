import { format } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import Leaderboard from '../src/Leaderboard.js';
import Menu from '../src/Menu';
import competitionDateString from '../src/competitionDateString';
import ensureDates from '../src/ensureDates.js';
import prisma from '../src/prisma';

const youtubers = [
  {
    name: 'Stefan Idstam',
    url: 'https://www.youtube.com/@stefanidstamgolf',
    avatar: {
      url: 'https://yt3.googleusercontent.com/5qBdv_1t7oHY1rD7rQzH7tq0NMb4OO9OwsOLL99QOMt3cr9M2nZ7-NDOUhuUPPT3MPxKtNecjg=s320-c-k-c0x00ffffff-no-rj',
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
}) {
  pastCompetitions.forEach(ensureDates);
  upcomingCompetitions.forEach(ensureDates);
  if (nextCompetition) {
    ensureDates(nextCompetition);
  }
  if (currentCompetition) {
    ensureDates(currentCompetition);
  }
  const now = new Date();

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
          <Link href="/players">
            <a>favorite players</a>
          </Link>{' '}
          and get the latest updates{' '}
          <Link href="/profile">
            <a>straight in your inbox</a>
          </Link>
          .
        </p>
        {currentCompetition && (
          <Leaderboard competition={currentCompetition} now={now} />
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
              {upcomingCompetitions.map(c => (
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
      <Link href={`/t/${competition.slug}${queryString}`}>
        <a className="competition">
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
        </a>
      </Link>
    </li>
  );
}

export async function getServerSideProps() {
  const competitions = await prisma.competition.findMany({
    orderBy: { end: 'asc' },
    where: { visible: true },
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

  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;

  const pastCompetitions = competitions
    .filter(c => c.end + h24 < now)
    .reverse()
    .slice(0, 3);
  let currentCompetition = competitions.filter(
    c => c.start <= now && c.end + h24 >= now,
  )[0];

  let upcomingCompetitions = competitions.filter(c => now < c.start);
  const nextCompetition = currentCompetition
    ? undefined
    : upcomingCompetitions[0];

  if (nextCompetition) {
    upcomingCompetitions.shift();
  }

  upcomingCompetitions = upcomingCompetitions.slice(0, 3);

  if (currentCompetition) {
    // re-read current comp, now with all the related info
    currentCompetition = await prisma.competition.findUnique({
      where: { id: currentCompetition.id },
      select: {
        id: true,
        name: true,
        venue: true,
        start: true,
        end: true,
        slug: true,
        leaderboardEntries: {
          orderBy: {
            position: 'asc',
          },
          select: {
            positionText: true,
            position: true,
            scoreText: true,
            score: true,
            hole: true,
            player: {
              select: {
                id: true,
                slug: true,
                firstName: true,
                lastName: true,
                clubName: true,
              },
            },
          },
        },
      },
    });
    currentCompetition.start = currentCompetition.start.getTime();
    currentCompetition.end = currentCompetition.end.getTime();
  }

  const props = {
    pastCompetitions,
    upcomingCompetitions,
  };
  if (nextCompetition) {
    props.nextCompetition = nextCompetition;
  }
  if (currentCompetition) {
    props.currentCompetition = currentCompetition;
  }
  return { props };
}
