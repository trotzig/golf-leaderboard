import '../../styles.css';

import React from 'react';

import AdvertisePage from '../AdvertisePage.js';
import Nav from '../Menu.js';

export default {
  title: 'AdvertisePage',
  component: AdvertisePage,
  decorators: [
    Story => (
      <div>
        <Nav />
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <AdvertisePage
    subscriberCount={585}
    playerCount={438}
    competitionCount={34}
    year={2026}
  />
);
