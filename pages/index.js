import { format } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import Leaderboard from '../src/Leaderboard.js';
import Menu from '../src/Menu';
import competitionDateString from '../src/competitionDateString';
import ensureDates from '../src/ensureDates.js';
import prisma from '../src/prisma';

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
${process.env.NEXT_PUBLIC_INTRO}
        `.trim()}
        />
      </Head>
      <Menu />
      <div className="competitions">
        <h2>{process.env.NEXT_PUBLIC_INTRO_TITLE}</h2>
        <p className="page-desc">{process.env.NEXT_PUBLIC_INTRO} </p>
        {currentCompetition && (
          <Leaderboard competition={currentCompetition} now={now} />
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
