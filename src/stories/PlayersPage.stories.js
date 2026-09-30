import '../../styles.css';

import React from 'react';

import PlayersPage from '../PlayersPage.js';
import playersData from './testData/players.json';
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
  <PlayersPage account={null} players={playersData.players} />
);

export const SignedIn = () => (
  <PlayersPage
    account={{ email: 'fan@example.com', favorites: [] }}
    players={playersData.players}
  />
);
