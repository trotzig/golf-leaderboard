import '../../styles.css';

import React from 'react';

import NotFoundPage from '../../pages/404.js';
import AboutPage from '../../pages/about.js';
import AddToHomeScreenPage from '../../pages/add-to-home-screen.js';
import UnsubscribedPage from '../../pages/unsubscribed.js';
import withNav from './withNav.js';

export default {
  title: 'StaticPages',
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const NotFound = () => <NotFoundPage />;
export const About = () => <AboutPage />;
export const AddToHomeScreen = () => <AddToHomeScreenPage />;
export const Unsubscribed = () => <UnsubscribedPage />;
