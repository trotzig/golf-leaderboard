import React from 'react';
import Link from 'next/link';

import Menu from '../src/Menu';
import SignInForm from '../src/SignInForm';
import profileProps from '../src/profileProps.js';

export default function SignInPage({ account }) {
  return (
    <div className="sign-in">
      <Menu />
      <h2>Sign in</h2>
      <div className="sign-in-main page-margin">
        {account ? (
          <div>
            <p>
              You are signed in as {account.email}.{' '}
              <Link href="/players">
                <a>Continue to your favorite players</a>
              </Link>
              .
            </p>
            <a href="/api/auth/logout" className="icon-button">
              Sign out
            </a>
          </div>
        ) : (
          <SignInForm title="Enter your email address" />
        )}
      </div>
    </div>
  );
}

export function getServerSideProps({ req }) {
  return profileProps({ req });
}
