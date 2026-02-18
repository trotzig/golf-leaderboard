import '../../styles.css';

import React from 'react';

import StartPage from '../StartPage.js';

const now = new Date('2024-06-15T12:00:00').getTime();

const pastCompetitions = [
  {
    id: 10,
    name: 'SGT Open Arlandastad',
    venue: 'Arlandastad Golf',
    slug: 'sgt-open-arlandastad',
    start: new Date('2024-05-02T00:00:00').getTime(),
    end: new Date('2024-05-04T00:00:00').getTime(),
  },
  {
    id: 11,
    name: 'SGT Open Ullna',
    venue: 'Ullna Golf & Country Club',
    slug: 'sgt-open-ullna',
    start: new Date('2024-05-23T00:00:00').getTime(),
    end: new Date('2024-05-25T00:00:00').getTime(),
  },
];

const upcomingCompetitions = [
  {
    id: 20,
    name: 'SGT Open Bro Hof Slott',
    venue: 'Bro Hof Slott Golf Club',
    slug: 'sgt-open-bro-hof',
    start: new Date('2024-07-04T00:00:00').getTime(),
    end: new Date('2024-07-06T00:00:00').getTime(),
  },
  {
    id: 21,
    name: 'SGT Open Kungsängen',
    venue: 'Kungsängen Golf Club',
    slug: 'sgt-open-kungsangen',
    start: new Date('2024-08-01T00:00:00').getTime(),
    end: new Date('2024-08-03T00:00:00').getTime(),
  },
];

const currentCompetitionBase = {
  id: 15,
  name: 'SGT Open Täby',
  venue: 'Täby Golf Club',
  slug: 'sgt-open-taby',
  start: new Date('2024-06-13T00:00:00').getTime(),
  end: new Date('2024-06-15T00:00:00').getTime(),
  finished: false,
};

const leaderboardEntries = [
  {
    position: 1,
    positionText: '1',
    score: -5,
    scoreText: '-5',
    hole: '18',
    player: { id: '1', slug: 'anders-lindqvist', firstName: 'Anders', lastName: 'Lindqvist', clubName: 'Stockholms GK' },
  },
  {
    position: 2,
    positionText: '2',
    score: -3,
    scoreText: '-3',
    hole: '16',
    player: { id: '2', slug: 'maria-eriksson', firstName: 'Maria', lastName: 'Eriksson', clubName: 'Kungliga GK' },
  },
  {
    position: 3,
    positionText: 'T3',
    score: -2,
    scoreText: '-2',
    hole: '14',
    player: { id: '3', slug: 'johan-bergstrom', firstName: 'Johan', lastName: 'Bergström', clubName: 'Vallda GK' },
  },
];

export default {
  title: 'StartPage',
  component: StartPage,
};

export const WithLeaderboard = () => (
  <StartPage
    now={now}
    pastCompetitions={pastCompetitions}
    upcomingCompetitions={upcomingCompetitions}
    currentCompetition={{ ...currentCompetitionBase, leaderboardEntries }}
  />
);

export const WithoutLeaderboard = () => (
  <StartPage
    now={now}
    pastCompetitions={pastCompetitions}
    upcomingCompetitions={upcomingCompetitions}
    currentCompetition={{ ...currentCompetitionBase, leaderboardEntries: [] }}
  />
);

export const NoActiveCompetition = () => (
  <StartPage
    now={now}
    pastCompetitions={pastCompetitions}
    upcomingCompetitions={upcomingCompetitions}
    nextCompetition={upcomingCompetitions[0]}
  />
);
