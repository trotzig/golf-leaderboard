import { format } from 'date-fns';
import Link from 'next/link';
import React from 'react';

import calendarDate from './calendarDate.mjs';
import competitionDateString from './competitionDateString';
import formatCompetitionName from './formatCompetitionName';
import getCompetitionTour from './getCompetitionTour.mjs';

export default function CompetitionListItem({ competition, now, current, next }) {
  const queryString = now > competition.end ? '?finished=1' : '';
  const classNames = ['competition-list-item'];
  if (current) classNames.push('current');
  if (next) classNames.push('next');
  const tour = getCompetitionTour(competition.categories);
  return (
    <li key={competition.id} className={classNames.join(' ')}>
      <Link
        href={`/t/${competition.slug}${queryString}`}
        className="competition"
      >
        <div className="calendar-event">
          <b>{format(calendarDate(competition.start), 'd')}</b>
          <span>{format(calendarDate(competition.start), 'MMM')}</span>
        </div>
        <div className="competition-details">
          <h4 className="competition-name">
            <span>{formatCompetitionName(competition.name)}</span>
          </h4>
          {tour && <span className="competition-tour">{tour}</span>}
          <p>
            {competition.venue} — {competitionDateString(competition, now)}
          </p>
        </div>
      </Link>
    </li>
  );
}
