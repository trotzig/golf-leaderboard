import '../../styles.css';

import React from 'react';

import PlayerPage from '../PlayerPage.js';
import { playerWithResults as player } from './mockData.js';
import withNav from './withNav.js';

const now = new Date('2026-09-30T12:00:00').getTime();

export default {
  title: 'PlayerPage',
  component: PlayerPage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => <PlayerPage player={player} season="2026" now={now} />;

export const PreviousSeason = () => (
  <PlayerPage player={player} season="2025" now={now} />
);

export const NoResults = () => (
  <PlayerPage
    player={{ ...player, oomPosition: null, competitionScore: [] }}
    season="2026"
    now={now}
  />
);
