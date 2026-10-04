import '../../styles.css';

import React from 'react';

import OrderOfMeritPage from '../OrderOfMeritPage.js';
import { orderOfMerit } from './mockData.js';
import withNav from './withNav.js';

export default {
  title: 'OrderOfMeritPage',
  component: OrderOfMeritPage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

const now = new Date('2026-10-04T12:00:00').getTime();

const upcomingCompetitions = [
  {
    id: 1,
    name: 'Destination Gotland Open',
    venue: 'Visby Golfklubb',
    slug: 'destination-gotland-open',
    start: new Date('2026-10-06T00:00:00').getTime(),
    end: new Date('2026-10-08T00:00:00').getTime(),
  },
  {
    id: 2,
    name: 'Road to Europe Final by Sparekassen Danmark',
    venue: 'Aalborg Golfklub',
    slug: 'road-to-europe-final',
    start: new Date('2026-10-14T00:00:00').getTime(),
    end: new Date('2026-10-16T00:00:00').getTime(),
  },
  {
    id: 3,
    name: 'Cutter & Buck Tour Qualifier',
    venue: 'Björkvik Golfklubb',
    slug: 'cutter-buck-tour-qualifier',
    start: new Date('2026-10-20T00:00:00').getTime(),
    end: new Date('2026-10-22T00:00:00').getTime(),
  },
];

export const Default = () => (
  <OrderOfMeritPage
    initialData={orderOfMerit}
    upcomingCompetitions={upcomingCompetitions}
    now={now}
  />
);

export const OtherOrderOfMerit = () => (
  <OrderOfMeritPage
    initialData={{
      ...orderOfMerit,
      OrderOfMeritData: { Name: 'Junior Ranking 2026' },
    }}
  />
);
