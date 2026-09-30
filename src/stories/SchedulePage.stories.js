import '../../styles.css';

import React from 'react';

import SchedulePage from '../SchedulePage.js';
import { competitions2025, competitions2026 } from './mockData.js';
import withNav from './withNav.js';

function cloneCompetitions(competitions) {
  // SchedulePage converts start/end to Date objects in place.
  return competitions.map(c => ({ ...c }));
}

const years = [2024, 2025, 2026];

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
    competitions={cloneCompetitions(competitions2026)}
    years={years}
    selectedYear={2026}
    now={new Date('2026-07-02T12:00:00').getTime()}
    showMap={false}
  />
);

export const PreviousSeason = () => (
  <SchedulePage
    competitions={cloneCompetitions(competitions2025)}
    years={years}
    selectedYear={2025}
    now={new Date('2026-07-02T12:00:00').getTime()}
    showMap={false}
  />
);
