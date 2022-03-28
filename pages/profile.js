import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import SignInForm from '../src/SignInForm';
import syncFavorites from '../src/syncFavorites';

export default function ProfilePage() {
  const [profile, setProfile] = useState();
  const [error, setError] = useState();
  const [sendEmailOnFinished, setSendEmailOnFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  useEffect(() => {
    async function run() {
      setIsLoading(true);
      const res = await fetch('/api/profile');
      setIsLoading(false);
      if (res.status === 401) {
        setProfile(null);
        return;
      }
      if (!res.ok) {
        setError(
          'Whoops! Something went wrong. Hopefully things will work if you reload the page!',
        );
        return;
      }
      const p = await res.json();
      setProfile(p);
      setSendEmailOnFinished(p.sendEmailOnFinished);
      await syncFavorites();
    }
    run();
  }, []);
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
      {error && <div className="alert page-margin">{error}</div>}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="page-margin">
          <div className="profile-settings">
            <label className="profile-setting">
              <span>Send emails when my favorite players finish a round</span>
              <input
                className="ios-switch"
                type="checkbox"
                disabled={!profile}
                checked={sendEmailOnFinished}
                onChange={e => setSendEmailOnFinished(e.target.checked)}
              />
            </label>
          </div>

          {profile ? (
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
              <p>
                To control your settings, you need to sign in first. Enter your
                email below to start the process.
              </p>
              <SignInForm />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
