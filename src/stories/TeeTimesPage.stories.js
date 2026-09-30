import '../../styles.css';

import React from 'react';

import TeeTimesPage from '../TeeTimesPage.js';
import ongoing from './testData/ongoing.json';
import withNav from './withNav.js';

// Competition.stories.js trims the entries of this same (shared) module, so
// trim a copy the same way to render identically regardless of load order.
const leaderboardData = JSON.parse(JSON.stringify(ongoing.initialData));
{
  const entries = Object.values(leaderboardData.Classes)[0].Leaderboard.Entries;
  for (const key of Object.keys(entries).slice(15)) {
    delete entries[key];
  }
}

const competition = {
  id: 1,
  name: 'ECCO Tour Spanish Masters - by DAT',
  venue: 'PGA Catalunya Resort, Girona',
  slug: 'ecco-tour-spanish-masters',
  start: new Date('2022-02-27T00:00:00').getTime(),
  end: new Date('2022-03-01T00:00:00').getTime(),
};

export default {
  title: 'TeeTimesPage',
  component: TeeTimesPage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <TeeTimesPage
    competition={{ ...competition }}
    now={new Date('2022-02-28T12:00:00').getTime()}
    initialData={ongoing.initialTimesData}
    initialLeaderboardData={leaderboardData}
  />
);

export const FirstRound = () => (
  <TeeTimesPage
    competition={{ ...competition }}
    now={new Date('2022-02-28T12:00:00').getTime()}
    round="1"
    initialData={ongoing.initialTimesData}
    initialLeaderboardData={leaderboardData}
  />
);
