import '../../styles.css';

import React from 'react';

import StartPage from '../StartPage.js';
import Nav from '../Menu.js';

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
    player: {
      id: '1',
      slug: 'anders-lindqvist',
      firstName: 'Anders',
      lastName: 'Lindqvist',
      clubName: 'Stockholms GK',
    },
  },
  {
    position: 2,
    positionText: '2',
    score: -3,
    scoreText: '-3',
    hole: '16',
    player: {
      id: '2',
      slug: 'maria-eriksson',
      firstName: 'Maria',
      lastName: 'Eriksson',
      clubName: 'Kungliga GK',
    },
  },
  {
    position: 3,
    positionText: 'T3',
    score: -2,
    scoreText: '-2',
    hole: '14',
    player: {
      id: '3',
      slug: 'johan-bergstrom',
      firstName: 'Johan',
      lastName: 'Bergström',
      clubName: 'Vallda GK',
    },
  },
];

const roadToEurope = {
  remainingEvents: [
    { id: 30, name: 'Destination Gotland Open', slug: 'destination-gotland-open' },
    {
      id: 31,
      name: 'Road to Europe Final by Sparekassen Danmark',
      slug: 'road-to-europe-final',
    },
  ],
  players: [
    ['1', 'Anders', 'Lindqvist', 'Stockholms GK'],
    ['2', 'Johan', 'Bergström', 'Vallda GK'],
    ['3', 'Mikkel', 'Dahlgaard', 'Havnevig Golf Klub'],
    ['4', 'Sindre', 'Berge', 'Fjordvik Golfklubb'],
    ['5', 'Eero', 'Kallio', 'Tallholmen Golf'],
    ['6', 'Viktor', 'Nyqvist', 'Björkvik Golfklubb'],
    ['T7', 'Casper', 'Skov', 'Egeskov Park Golf'],
    ['T7', 'Linus', 'Ståhl', 'Skogsberga GK'],
  ].map(([oomPosition, firstName, lastName, clubName], i) => ({
    id: `rte-${i}`,
    slug: `${firstName}-${lastName}`.toLowerCase(),
    firstName,
    lastName,
    clubName,
    oomPosition,
  })),
};

export default {
  title: 'StartPage',
  component: StartPage,
  decorators: [
    Story => (
      <div>
        <Nav activeHref="/" />
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
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

export const RoadToEuropeRace = () => (
  <StartPage
    now={now}
    pastCompetitions={pastCompetitions}
    upcomingCompetitions={upcomingCompetitions}
    nextCompetition={upcomingCompetitions[0]}
    roadToEurope={roadToEurope}
  />
);

export const RoadToEuropeFinalStandings = () => (
  <StartPage
    now={now}
    pastCompetitions={pastCompetitions}
    upcomingCompetitions={upcomingCompetitions}
    nextCompetition={upcomingCompetitions[0]}
    roadToEurope={{ ...roadToEurope, remainingEvents: [] }}
  />
);
