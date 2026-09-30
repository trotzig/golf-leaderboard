import '../../styles.css';

import React from 'react';

import PlayersPage from '../PlayersPage.js';
import { players } from './mockData.js';
import withNav from './withNav.js';

export default {
  title: 'PlayersPage',
  component: PlayersPage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const SignedOut = () => (
  <PlayersPage account={null} players={players} />
);

export const SignedIn = () => (
  <PlayersPage
    account={{ email: 'fan@example.com', favorites: [] }}
    players={players}
  />
);
