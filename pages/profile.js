import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import useData from '../src/useData';
import Menu from '../src/Menu';
import SignInForm from '../src/SignInForm';
import syncFavorites from '../src/syncFavorites';

export default function ProfilePage() {
  const [profile, isLoading] = useData('/api/profile');
  const [sendEmailOnFinished, setSendEmailOnFinished] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSendEmailOnFinished(profile && profile.sendEmailOnFinished);
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    async function run() {
      await fetch('/api/account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sendEmailOnFinished }),
      });
    }
    run();
  }, [sendEmailOnFinished]);

  return (
    <div className="profile">
      <Menu />
      <h2>Your settings</h2>
      <div className="page-margin">
        <div className="profile-settings">
          <label className="profile-setting">
            <span>Send emails when my favorite players finish a round</span>
            <input
              className="ios-switch"
              type="checkbox"
              disabled={!profile}
              checked={sendEmailOnFinished}
              onChange={e => {
                setSendEmailOnFinished(e.target.checked);
                syncFavorites();
              }}
            />
          </label>
        </div>

        {isLoading ? null : profile ? (
          <div className="profile-signed-in">
            <p>
              Signed in as <b>{profile.email}</b>
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
