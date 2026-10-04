import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';

import ReportBlurbs from './ReportBlurbs.js';
import RoadToEuropeTeaser from './RoadToEuropeTeaser.js';
import Leaderboard from './Leaderboard.js';
import CompetitionListItem from './CompetitionListItem.js';
import ensureDates from './ensureDates.js';
import { preloadJsonPData } from './fetchJsonP.js';

export default function StartPage({
  pastCompetitions,
  upcomingCompetitions,
  nextCompetition,
  currentCompetition,
  reports,
  roadToEurope,
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
        {currentCompetition && (
          <Leaderboard competition={currentCompetition} now={now} />
        )}
        <div className={currentCompetition ? 'intro intro--compact' : 'intro'}>
          {currentCompetition ? null : <CourseContours />}
          <h1 className="intro-title">A launchpad for nordic golfers.</h1>
          <p className="page-desc">
            The Cutter &amp; Buck Tour is the first step for Nordic
            professional golfers on their way to the Challenge Tour and the DP
            World Tour. We track the scores so that you can follow your{' '}
            <Link href="/players">favorite players</Link> and get the latest
            updates <Link href="/profile">straight in your inbox</Link>.
          </p>
        </div>
        {nextCompetition ? (
          <ul>
            <CompetitionListItem competition={nextCompetition} now={now} next />
          </ul>
        ) : null}
        {roadToEurope && (
          <RoadToEuropeTeaser
            players={roadToEurope.players}
            remainingEvents={roadToEurope.remainingEvents}
          />
        )}
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

// Decorative elevation lines, like the green contours in a yardage book.
function CourseContours() {
  const rings = [
    [150, 112, -8],
    [122, 90, -4],
    [96, 70, 0],
    [72, 52, 4],
    [50, 36, 8],
    [30, 22, 12],
    [13, 10, 16],
  ];
  return (
    <svg
      className="intro-contours"
      viewBox="0 0 360 280"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      {rings.map(([rx, ry, rotate], i) => (
        <ellipse
          key={rx}
          cx={180 + i * 4}
          cy={140 - i * 2}
          rx={rx}
          ry={ry}
          transform={`rotate(${rotate - 12} 180 140)`}
        />
      ))}
    </svg>
  );
}
