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
        {nextCompetition ? (
          <>
            <h3>Next event</h3>
            <ul>
              <CompetitionListItem competition={nextCompetition} now={now} />
            </ul>
          </>
        ) : null}
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
  return {
    redirect: {
      destination: '/t/kevinge-foursome--fourball-stockholms-golfklubb-2025',
      permanent: false,
    },
  };
}
