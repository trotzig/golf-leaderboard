import '../../styles.css';

import React from 'react';

import EmbedPage from '../EmbedPage.js';
import { competitions2026, players as mockPlayers } from './mockData.js';

const competition = competitions2026[12];

const now = new Date('2026-09-25T15:00:00');

const results = [
  { positionText: '1', scoreText: '-13', hole: 'F' },
  { positionText: '2', scoreText: '-11', hole: 'F' },
  { positionText: 'T12', scoreText: 'E', hole: '14' },
];

const players = results.map((leaderboardEntry, i) => ({
  ...mockPlayers[i],
  leaderboardEntry,
}));

export default {
  title: 'EmbedPage',
  component: EmbedPage,
};

export const SinglePlayer = () => (
  <EmbedPage
    title="Live score"
    players={[players[1]]}
    competition={{ ...competition }}
    now={now}
  />
);

export const Club = () => (
  <EmbedPage
    title="Club live scores"
    players={players}
    competition={{ ...competition }}
    now={now}
  />
);
