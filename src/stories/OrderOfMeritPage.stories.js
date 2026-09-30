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

export const Default = () => <OrderOfMeritPage initialData={orderOfMerit} />;
