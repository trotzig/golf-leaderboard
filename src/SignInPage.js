import Head from 'next/head';
import React from 'react';
import Link from 'next/link';

import SignInForm from './SignInForm';

export default function SignInPage({ account }) {
  return (
    <div className="sign-in">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <h2>Sign in</h2>
      <div className="sign-in-main page-margin">
        {account ? (
          <div>
            <p>
              You are signed in as {account.email}.{' '}
              <Link href="/players">Continue to your favorite players</Link>
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
