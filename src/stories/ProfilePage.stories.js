import '../../styles.css';

import React from 'react';

import ProfilePage from '../ProfilePage.js';
import SignInPage from '../SignInPage.js';
import withNav from './withNav.js';

const account = {
  email: 'fan@example.com',
  sendEmailOnStart: false,
  sendEmailOnFinished: true,
  sendEmailOnHotStreak: true,
  favorites: [
    {
      id: '010515-018',
      firstName: 'David',
      lastName: 'Lundgren',
      slug: 'david-lundgren',
    },
    {
      id: '020618-005',
      firstName: 'Algot',
      lastName: 'Kleén',
      slug: 'algot-kleen',
    },
    {
      id: '2-3476',
      firstName: 'Martin Leth',
      lastName: 'Simonsen',
      slug: 'martin-leth-simonsen',
    },
  ],
};

export default {
  title: 'ProfilePage',
  component: ProfilePage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const SignedOut = () => <ProfilePage />;

export const SignedIn = () => <ProfilePage account={account} />;

export const SignedInWithoutFavorites = () => (
  <ProfilePage account={{ ...account, favorites: [] }} />
);

export const SignIn = () => <SignInPage />;

export const SignInWhenSignedIn = () => <SignInPage account={account} />;
