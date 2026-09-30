import '../../styles.css';

import React from 'react';

import PlayerDialog from '../PlayerDialog.js';
import {
  competitions2026,
  leaderboardData,
  leaderboardEntry,
} from './mockData.js';

const competition = competitions2026[11];

export default {
  title: 'PlayerDialog',
  component: PlayerDialog,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <PlayerDialog
    entry={leaderboardEntry}
    competition={competition}
    data={leaderboardData}
    onClose={() => {}}
    collidingSlugs={new Map()}
  />
);
