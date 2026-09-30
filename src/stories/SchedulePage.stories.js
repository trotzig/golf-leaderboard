import '../../styles.css';

import React from 'react';

import SchedulePage from '../SchedulePage.js';
import scheduleData from './testData/schedule.json';
import withNav from './withNav.js';

function cloneCompetitions(competitions) {
  // SchedulePage converts start/end to Date objects in place.
  return competitions.map(c => ({ ...c }));
}

export default {
  title: 'SchedulePage',
  component: SchedulePage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

// The tour map loads map tiles from a third-party CDN, so it is left out to
// keep screenshots stable.
export const CurrentSeason = () => (
  <SchedulePage
    competitions={cloneCompetitions(scheduleData.competitions)}
    years={scheduleData.years}
    selectedYear={2026}
    now={new Date('2026-07-02T12:00:00').getTime()}
    showMap={false}
  />
);

export const PreviousSeason = () => (
  <SchedulePage
    competitions={cloneCompetitions(scheduleData.previousYearCompetitions)}
    years={scheduleData.years}
    selectedYear={2025}
    now={new Date('2026-07-02T12:00:00').getTime()}
    showMap={false}
  />
);
