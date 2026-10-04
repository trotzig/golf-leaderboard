import { startOfDay } from 'date-fns';
import Link from 'next/link';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';

import CompetitionListItem from './CompetitionListItem.js';
import Icon from './Icon';
import Leaderboard from './Leaderboard.js';
import { isGoodScore, isStablefordText } from './competitionFormat.mjs';
import ensureDates from './ensureDates.js';
import fixParValue from './fixParValue';
import formatCompetitionName from './formatCompetitionName';
import getCompetitionTour from './getCompetitionTour.mjs';
import locations from './locations.json';
import normalizeName from './normalizeName.js';
import { shortDateRange, splitSchedule } from './scheduleSections.mjs';

export default function SchedulePage({
  competitions,
  years,
  selectedYear,
  now: nowMs,
  showMap = true,
}) {
  competitions.forEach(ensureDates);
  const now = new Date(nowMs);
  const { upcoming, current, next, past } = splitSchedule(competitions, now);
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
              now={startOfDay(now)}
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
        {upcoming.length > 0 && (
          <>
            <h3>Upcoming</h3>
            <ul className="schedule-list">
              {upcoming.map(c => (
                <ScheduleRow key={c.id} competition={c} />
              ))}
            </ul>
          </>
        )}
        {current.map(c => (
          <Leaderboard
            key={c.id}
            competition={{
              ...c,
              leaderboardEntries: c.leaderboardEntries || [],
            }}
            now={now}
          />
        ))}
        {next && (
          <ul className="schedule-featured">
            <CompetitionListItem competition={next} now={now} next />
          </ul>
        )}
        {past.length > 0 && (
          <>
            <h3>Results</h3>
            <ul className="schedule-list">
              {past.map(c => (
                <ScheduleRow key={c.id} competition={c} past />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function ScheduleRow({ competition, past }) {
  const tour = getCompetitionTour(competition.categories);
  return (
    <li className="schedule-row">
      <Link
        href={`/t/${competition.slug}${past ? '?finished=1' : ''}`}
        className="schedule-row-link"
      >
        <span className="schedule-row-date">
          {shortDateRange(competition.start, competition.end)}
        </span>
        <span className="schedule-row-name">
          {formatCompetitionName(competition.name)}
        </span>
        {past ? (
          <Winner winner={competition.winner} />
        ) : (
          <span className="schedule-row-meta">
            {[competition.venue, tour].filter(Boolean).join(' · ')}
          </span>
        )}
      </Link>
    </li>
  );
}

function Winner({ winner }) {
  if (!winner) {
    return null;
  }
  const names = winner.names.map(normalizeName);
  const format = isStablefordText(winner.scoreText)
    ? 'stableford'
    : 'strokeplay';
  return (
    <span className="schedule-row-winner">
      <Icon name="trophy" />
      <span className="schedule-row-winner-name">
        {names.length > 2
          ? `${names[0]} +${names.length - 1}`
          : names.join(' & ')}
      </span>
      <b className={isGoodScore(format, winner.score) ? 'under-par' : ''}>
        {fixParValue(winner.scoreText)}
      </b>
    </span>
  );
}
