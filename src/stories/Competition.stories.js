import '../../styles.css';

import React from 'react';

import CompetitionPage from '../CompetitionPage.js';
import finished from './testData/finished.json';
import ongoing from './testData/ongoing.json';
import upcoming from './testData/upcoming.json';

function slimEntries(data) {
  const entries = Object.values(data.initialData.Classes)[0].Leaderboard
    .Entries;
  const toRemove = Object.keys(entries).slice(15);
  for (const key of toRemove) {
    delete entries[key];
  }
}

slimEntries(ongoing);
slimEntries(finished);

const competition = {
  id: 1,
  name: 'ECCO Tour Spanish Masters - by DAT',
  venue: 'PGA Catalunya Resort, Girona',
  start: new Date('2022-02-27T00:00:00'),
  end: new Date('2022-03-01T00:00:00'),
};

export default {
  title: 'CompetitionPage',
  component: CompetitionPage,
};

export const Empty = () => (
  <CompetitionPage competition={competition} loadingOverride />
);
export const Ongoing = () => (
  <CompetitionPage
    {...ongoing}
    lazyItems={false}
    now={new Date('2022-02-28T12:00:00')}
    competition={competition}
    initialPlayersData={{}}
  />
);
export const Finished = () => (
  <CompetitionPage
    {...finished}
    lazyItems={false}
    now={new Date('2022-03-03T12:00:00')}
    competition={competition}
    initialPlayersData={{}}
  />
);
export const Upcoming = () => (
  <CompetitionPage
    {...upcoming}
    lazyItems={false}
    now={new Date('2022-02-22T12:00:00')}
    competition={competition}
    initialPlayersData={{}}
  />
);
