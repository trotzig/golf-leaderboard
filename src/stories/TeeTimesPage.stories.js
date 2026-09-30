import '../../styles.css';

import React from 'react';

import TeeTimesPage from '../TeeTimesPage.js';
import { competitions2026, leaderboardData, teeTimes } from './mockData.js';
import withNav from './withNav.js';

const competition = competitions2026[11];
const now = new Date('2026-09-10T12:00:00').getTime();

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
    now={now}
    initialData={teeTimes}
    initialLeaderboardData={leaderboardData}
  />
);

export const FirstRound = () => (
  <TeeTimesPage
    competition={{ ...competition }}
    now={now}
    round="1"
    initialData={teeTimes}
    initialLeaderboardData={leaderboardData}
  />
);
