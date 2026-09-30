import '../../styles.css';

import React from 'react';

import OrderOfMeritPage from '../OrderOfMeritPage.js';
import oom from './testData/oom.json';
import withNav from './withNav.js';

export default {
  title: 'OrderOfMeritPage',
  component: OrderOfMeritPage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => <OrderOfMeritPage initialData={oom} />;
