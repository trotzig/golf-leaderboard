import Head from 'next/head';
import React from 'react';

import Icon from '../src/Icon';

export default function AddToHomeScreen() {
  return (
    <div className="add-to-home-screen-page">
      <Head>
        <title>Add to home screen – Nordic Golf Tour</title>
      </Head>
      <h2>Add to home screen</h2>
      <p className="page-desc">
        Install this site as an app for quick access to live scores and
        leaderboards — no app store needed.
      </p>

      <section className="aths-section">
        <h3>On iPhone or iPad (Safari)</h3>
        <ol className="aths-steps">
          <li>
            Open this page in <strong>Safari</strong>.
          </li>
          <li>
            Tap the <strong>Share</strong> button{' '}
            <span className="aths-icon" aria-hidden="true">
              <Icon name="share" />
            </span>{' '}
            at the bottom of the screen.
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>.
          </li>
          <li>
            Tap <strong>Add</strong> in the top-right corner.
          </li>
        </ol>
      </section>

      <section className="aths-section">
        <h3>On Android (Chrome)</h3>
        <ol className="aths-steps">
          <li>
            Open this page in <strong>Chrome</strong>.
          </li>
          <li>
            Tap the <strong>menu</strong>{' '}
            <span className="aths-icon" aria-hidden="true">
              <Icon name="more" />
            </span>{' '}
            in the top-right corner.
          </li>
          <li>
            Tap <strong>Add to Home screen</strong> or{' '}
            <strong>Install app</strong>.
          </li>
          <li>
            Tap <strong>Add</strong> or <strong>Install</strong> to confirm.
          </li>
        </ol>
      </section>
    </div>
  );
}
