import '../../styles.css';

import React from 'react';

import PlayerDialog from '../PlayerDialog.js';
import ongoing from './testData/ongoing.json';

const data = JSON.parse(JSON.stringify(ongoing.initialData));
const entry = Object.values(Object.values(data.Classes)[0].Leaderboard.Entries)[0];

const competition = {
  id: 1,
  name: 'ECCO Tour Spanish Masters - by DAT',
  venue: 'PGA Catalunya Resort, Girona',
  slug: 'ecco-tour-spanish-masters',
  start: new Date('2022-02-27T00:00:00'),
  end: new Date('2022-03-01T00:00:00'),
};

export default {
  title: 'PlayerDialog',
  component: PlayerDialog,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <PlayerDialog
    entry={entry}
    competition={competition}
    data={data}
    onClose={() => {}}
    collidingSlugs={new Map()}
  />
);
