import '../../styles.css';

import React from 'react';

import EmbedPage from '../EmbedPage.js';

const competition = {
  id: 5398146,
  name: 'Folksam Championship',
  venue: 'Barsebäck Golf & Resort',
  slug: 'folksam-championship-2026',
  start: new Date('2026-09-23T00:00:00').getTime(),
  end: new Date('2026-09-25T00:00:00').getTime(),
};

const now = new Date('2026-09-25T15:00:00');

const players = [
  {
    id: '020618-005',
    firstName: 'Algot',
    lastName: 'Kleén',
    clubName: 'Kungsbacka Golfklubb',
    leaderboardEntry: { positionText: '1', scoreText: '-13', hole: 'F' },
  },
  {
    id: '010515-018',
    firstName: 'David',
    lastName: 'Lundgren',
    clubName: 'Ängelholms Golfklubb',
    leaderboardEntry: { positionText: '2', scoreText: '-11', hole: 'F' },
  },
  {
    id: '2-3476',
    firstName: 'Martin Leth',
    lastName: 'Simonsen',
    clubName: 'Aalborg Golf Klub',
    leaderboardEntry: { positionText: 'T12', scoreText: 'E', hole: '14' },
  },
];

export default {
  title: 'EmbedPage',
  component: EmbedPage,
};

export const SinglePlayer = () => (
  <EmbedPage
    title="David Lundgren - live score"
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
