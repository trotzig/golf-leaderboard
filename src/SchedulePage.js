import { format, startOfDay } from 'date-fns';
import Link from 'next/link';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';

import Icon from './Icon';
import { LeaderboardTable } from './Leaderboard.js';
import VenueMapLink from './VenueMapLink.js';
import competitionDateString from './competitionDateString.js';
import { isGoodScore, isStablefordText } from './competitionFormat.mjs';
import ensureDates from './ensureDates.js';
import fixParValue from './fixParValue';
import formatCompetitionName from './formatCompetitionName';
import getCompetitionTour from './getCompetitionTour.mjs';
import locations from './locations.json';
import normalizeName from './normalizeName.js';
import {
  getWinner,
  roundCount,
  shortDateRange,
  shortTourName,
  splitSchedule,
  startsIn,
} from './scheduleSections.mjs';

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
                <ScheduleItem key={c.id} competition={c} now={now} kind="upcoming" />
              ))}
            </ul>
          </>
        )}
        {(current.length > 0 || next) && (
          <ul className="schedule-list schedule-list--featured">
            {current.map(c => (
              <ScheduleItem key={c.id} competition={c} now={now} kind="current" />
            ))}
            {next && <ScheduleItem competition={next} now={now} kind="next" />}
          </ul>
        )}
        {past.length > 0 && (
          <>
            <h3>Past events</h3>
            <ul className="schedule-list">
              {past.map(c => (
                <ScheduleItem key={c.id} competition={c} now={now} kind="past" />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// Every event is a disclosure: the summary is a one-liner, and expanding it
// shows the leaderboard (current), the top three (past) or what to look
// forward to (upcoming). The current and next events start out expanded.
function ScheduleItem({ competition, now, kind }) {
  const featured = kind === 'current' || kind === 'next';
  const tour = getCompetitionTour(competition.categories);
  const finished = competition.finished;
  let legend;
  if (kind === 'current') {
    legend = finished ? 'Final results' : 'Live now';
  } else if (kind === 'next') {
    legend = 'Next event';
  }
  return (
    <li>
      <details
        className={`schedule-item schedule-item--${kind}`}
        open={featured}
      >
        <summary className="schedule-summary">
          {legend && (
            <span
              className={`schedule-legend${
                kind === 'current' && !finished ? ' schedule-legend--live' : ''
              }`}
            >
              {legend}
            </span>
          )}
          <span className="schedule-row-date">
            {shortDateRange(competition.start, competition.end)}
          </span>
          <span className="schedule-row-title">
            <span className="schedule-row-name">
              {formatCompetitionName(competition.name)}
            </span>
            {tour && (
              <span className="schedule-tour">
                <span className="schedule-tour-full">{tour}</span>
                <abbr className="schedule-tour-short" title={tour}>
                  {shortTourName(tour)}
                </abbr>
              </span>
            )}
          </span>
          <SummaryAside competition={competition} now={now} kind={kind} />
          <span className="schedule-chevron" aria-hidden="true" />
        </summary>
        <div className="schedule-panel">
          {kind === 'current' && competition.leaderboardEntries?.length > 0 && (
            <LeaderboardTable
              entries={competition.leaderboardEntries}
              finished={finished}
            />
          )}
          {kind === 'past' && competition.podium?.length > 0 && (
            <LeaderboardTable
              entries={competition.podium}
              limit={competition.podium.length}
              finished
            />
          )}
          <Facts competition={competition} tour={tour} now={now} kind={kind} />
          <Link
            href={`/t/${competition.slug}${kind === 'past' ? '?finished=1' : ''}`}
            className="schedule-panel-link"
          >
            {kind === 'current' && 'View full leaderboard'}
            {kind === 'past' && 'View full results'}
            {(kind === 'upcoming' || kind === 'next') && 'View event'}{' '}
            <Icon name="arrow-right" />
          </Link>
        </div>
      </details>
    </li>
  );
}

function SummaryAside({ competition, now, kind }) {
  if (kind === 'past') {
    return <Winner winner={getWinner(competition.podium)} />;
  }
  let text = competition.venue;
  if (kind === 'next') {
    text = startsIn(competition.start, now);
  } else if (kind === 'current') {
    text = competitionDateString(competition, now, {
      finished: competition.finished,
      parts: true,
    }).suffix;
  }
  return <span className="schedule-row-meta">{text}</span>;
}

function Facts({ competition, tour, now, kind }) {
  const rounds = roundCount(competition);
  const toCome = kind === 'upcoming' || kind === 'next';
  const lastVisit = toCome && competition.lastVisit;
  const lastWinner = lastVisit && getWinner(lastVisit.podium);
  return (
    <dl className="schedule-facts">
      {toCome && (
        <>
          <dt>When</dt>
          <dd>
            {format(competition.start, 'EEE d MMM')} –{' '}
            {format(competition.end, 'EEE d MMM')}
            {kind === 'upcoming' &&
              ` · ${startsIn(competition.start, now).toLowerCase()}`}
          </dd>
        </>
      )}
      {toCome && rounds && (
        <>
          <dt>Format</dt>
          <dd>
            {rounds} {rounds === 1 ? 'round' : 'rounds'}
          </dd>
        </>
      )}
      {competition.venue && (
        <>
          <dt>Where</dt>
          <dd>
            <VenueMapLink venue={competition.venue} />
          </dd>
        </>
      )}
      {tour && (
        <>
          <dt>Tour</dt>
          <dd>{tour}</dd>
        </>
      )}
      {lastWinner && (
        <>
          <dt>Last time here</dt>
          <dd>
            <Link href={`/t/${lastVisit.slug}?finished=1`}>
              {formatCompetitionName(lastVisit.name)} {lastVisit.year}
            </Link>
            <Winner winner={lastWinner} />
          </dd>
        </>
      )}
    </dl>
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
