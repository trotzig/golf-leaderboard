import '../../styles.css';

import React from 'react';

import ProfilePage from '../ProfilePage.js';
import SignInPage from '../SignInPage.js';
import { players } from './mockData.js';
import withNav from './withNav.js';

const account = {
  email: 'fan@example.com',
  sendEmailOnStart: false,
  sendEmailOnFinished: true,
  sendEmailOnHotStreak: true,
  favorites: players.slice(0, 3),
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
