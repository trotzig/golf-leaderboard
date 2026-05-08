import { format } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';

import ReportBlurbs from './ReportBlurbs.js';
import Leaderboard from './Leaderboard.js';
import competitionDateString from './competitionDateString';
import formatCompetitionName from './formatCompetitionName';
import ensureDates from './ensureDates.js';
import { preloadJsonPData } from './fetchJsonP.js';

export default function StartPage({
  pastCompetitions,
  upcomingCompetitions,
  nextCompetition,
  currentCompetition,
  reports,
  now: nowMs,
}) {
  const router = useRouter();

  useEffect(() => {
    let wasHidden = false;
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
      } else if (wasHidden) {
        wasHidden = false;
        router.replace(router.asPath);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  pastCompetitions.forEach(ensureDates);
  upcomingCompetitions.forEach(ensureDates);
  if (nextCompetition) {
    ensureDates(nextCompetition);
  }
  if (currentCompetition) {
    ensureDates(currentCompetition);
  }
  const now = new Date(nowMs);

  const prefetchCompetitionIds = useMemo(
    () =>
      currentCompetition
        ? [currentCompetition.id]
        : [upcomingCompetitions[0]?.id, pastCompetitions[0]?.id].filter(
            Boolean,
          ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCompetition?.id, upcomingCompetitions[0]?.id, pastCompetitions[0]?.id],
  );

  useEffect(() => {
    for (const id of prefetchCompetitionIds) {
      [
        'LeaderboardHandler/GetLeaderboard',
        'TeeTimesHandler/GetTeeTimes',
        'PlayersHandler/GetPlayers',
        'CompetitionHandler/GetCompetition',
      ].forEach(handler => {
        preloadJsonPData(
          `https://scores.golfbox.dk/Handlers/${handler}/CompetitionId/${id}/language/2057/`,
        );
      });
    }
  }, [prefetchCompetitionIds]);

  return (
    <div className="chrome">
      <Head>
        <title>{process.env.NEXT_PUBLIC_INTRO_TITLE}</title>
        <meta
          name="description"
          content={`${process.env.NEXT_PUBLIC_INTRO_TITLE} — ${process.env.NEXT_PUBLIC_INTRO} Follow your favorite players and get the latest updates straight in your inbox.`}
        />
        <meta
          property="og:title"
          content={process.env.NEXT_PUBLIC_INTRO_TITLE}
        />
        <meta
          property="og:description"
          content={`${process.env.NEXT_PUBLIC_INTRO_TITLE} — ${process.env.NEXT_PUBLIC_INTRO} Follow your favorite players and get the latest updates straight in your inbox.`}
        />
        <meta property="og:type" content="website" />
        <meta
          name="twitter:title"
          content={process.env.NEXT_PUBLIC_INTRO_TITLE}
        />
        <meta
          name="twitter:description"
          content={`${process.env.NEXT_PUBLIC_INTRO_TITLE} — ${process.env.NEXT_PUBLIC_INTRO} Follow your favorite players and get the latest updates straight in your inbox.`}
        />
      </Head>
      <div className="competitions">
        <h1 className="intro-title">A launchpad for nordic golfers.</h1>
        <p className="page-desc">
          The Cutter &amp; Buck Tour is the first step for Nordic professional
          golfers on their way to the Challenge Tour and the DP World Tour. We
          track the scores so that you can follow your{' '}
          <Link href="/players">favorite players</Link> and get the latest
          updates <Link href="/profile">straight in your inbox</Link>.
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
          <ReportBlurbs reports={reports} showViewAll />
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
    <li key={competition.id} className={classNames.join(' ')}>
      <Link
        href={`/t/${competition.slug}${queryString}`}
        className="competition"
      >
        <div className="calendar-event">
          <b>{format(competition.start, 'd')}</b>
          <span>{format(competition.start, 'MMM')}</span>
        </div>
        <div className="competition-details">
          <h4 className="competition-name">
            <span>{formatCompetitionName(competition.name)}</span>
          </h4>
          <p>
            {competition.venue} — {competitionDateString(competition, now)}
          </p>
        </div>
      </Link>
    </li>
  );
}
