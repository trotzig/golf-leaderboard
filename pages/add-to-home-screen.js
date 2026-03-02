import Head from 'next/head';
import React from 'react';
import Menu from '../src/Menu.js';

export default function AddToHomeScreen() {
  return (
    <div className="add-to-home-screen-page">
      <Head>
        <title>Add to home screen – Nordic Golf Tour</title>
      </Head>
      <Menu />
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
              {/* Share icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
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
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
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
