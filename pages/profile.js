import React, { useEffect, useState } from 'react';

import Menu from '../src/Menu';
import SignInForm from '../src/SignInForm';
import profileProps from '../src/profileProps.js';
import syncFavorites from '../src/syncFavorites';

export default function ProfilePage({ account }) {
  const [sendEmailOnFinished, setSendEmailOnFinished] = useState(
    account ? account.sendEmailOnFinished : false,
  );
  const [sendEmailOnStart, setSendEmailOnStart] = useState(
    account ? account.sendEmailOnStart : false,
  );

  useEffect(() => {
    if (!account) {
      return;
    }
    async function run() {
      await fetch('/api/account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sendEmailOnFinished, sendEmailOnStart }),
      });
    }
    run();
  }, [sendEmailOnFinished, sendEmailOnStart]);

  return (
    <div className="profile">
      <Menu />
      <h2>Your settings</h2>
      <div className="page-margin">
        <div className="profile-settings">
          <label className="profile-setting">
            <span>Send an email when a favorite player finishes a round</span>
            <input
              className="ios-switch"
              type="checkbox"
              disabled={!account}
              checked={sendEmailOnFinished}
              onChange={e => {
                setSendEmailOnFinished(e.target.checked);
                syncFavorites();
              }}
            />
          </label>
          <label className="profile-setting">
            <span>Send an email when a favorite player starts a round</span>
            <input
              className="ios-switch"
              type="checkbox"
              disabled={!account}
              checked={sendEmailOnStart}
              onChange={e => {
                setSendEmailOnStart(e.target.checked);
                syncFavorites();
              }}
            />
          </label>
        </div>

        {account ? (
          <div className="profile-signed-in">
            <p>
              Signed in as <b>{account.email}</b>
            </p>
            <a href="/api/auth/logout" className="icon-button">
              Sign out
            </a>
          </div>
        ) : (
          <div className="profile-signed-out">
            <SignInForm title="Sign in to change settings" />
          </div>
        )}
      </div>
    </div>
  );
}

export function getServerSideProps({ req }) {
  return profileProps({ req });
}
