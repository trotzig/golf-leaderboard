import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import SignInForm from '../src/SignInForm';

export default function ProfilePage() {
  const [profile, setProfile] = useState();
  const [error, setError] = useState();
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
      setProfile(await res.json());
    }
    run();
  }, []);

  return (
    <div className="profile">
      <Menu />
      <h2>Your settings</h2>
      {error && <div className="alert page-margin">{error}</div>}
      {isLoading ? (
        <LoadingSkeleton />
      ) : profile === null ? (
        <div className="page-margin">
          <p>
            To update your settings, you need to sign in first. Enter your email
            below to start the process.
          </p>
          <SignInForm
            onSuccess={() => {
              router.reload();
            }}
          />
        </div>
      ) : (
        <div className="profile-signed-in page-margin">
        <p>{JSON.stringify(profile)}</p>
          <a href="/api/auth/logout" className="icon-button">
            Sign out
          </a>
        </div>
      )}
    </div>
  );
}
