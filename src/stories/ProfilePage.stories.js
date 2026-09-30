import '../../styles.css';

import React from 'react';

import ProfilePage from '../ProfilePage.js';
import SignInForm from '../SignInForm.js';
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

export const SignInFormEnterCode = () => (
  <div className="page-margin">
    <SignInForm initialState={{ step: 'code', email: 'fan@example.com' }} />
  </div>
);

export const SignInFormWrongCode = () => (
  <div className="page-margin">
    <SignInForm
      initialState={{
        step: 'code',
        email: 'fan@example.com',
        error: 'invalid-code',
      }}
    />
  </div>
);

export const SignInFormExpiredCode = () => (
  <div className="page-margin">
    <SignInForm
      initialState={{ step: 'code', email: 'fan@example.com', error: 'expired' }}
    />
  </div>
);

export const SignInFormSendFailed = () => (
  <div className="page-margin">
    <SignInForm
      initialState={{ email: 'fan@example.com', error: 'send-failed' }}
    />
  </div>
);
