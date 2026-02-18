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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Create round 2 data with projected cut line (cut is after round 2, still being played)
const round1WithCut = deepClone(ongoing);
{
  const classKey = Object.keys(round1WithCut.initialData.Classes)[0];
  const clazz = round1WithCut.initialData.Classes[classKey];
  // Simulate round 2 (the cut round) still in progress
  clazz.Leaderboard.ActiveRoundNumber = 2;
  // Cut hasn't been performed yet
  clazz.Cut = { IsPerformed: false, AfterRound: 2 };
  // Set cut config with Limit of 10 (within our 15 slimmed entries)
  round1WithCut.initialData.CompetitionData.Classes[0].Cut = {
    Enabled: true,
    Limit: 10,
    LimitType: 'Players',
    LimitMethod: 1,
    AfterRound: 2,
    ExcludeAmateurs: false,
    IncludeScore: 0,
  };
}

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
    initialCompetitionData={{ DefaultAction: 'finalresults' }}
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
export const ProjectedCutLine = () => (
  <CompetitionPage
    {...round1WithCut}
    lazyItems={false}
    now={new Date('2022-02-27T12:00:00')}
    competition={competition}
    initialPlayersData={{}}
  />
);
export const FinishedWithCut = () => (
  <CompetitionPage
    {...finished}
    lazyItems={false}
    now={new Date('2022-03-03T12:00:00')}
    competition={competition}
    initialPlayersData={{}}
    initialCompetitionData={{ DefaultAction: 'finalresults' }}
  />
);
