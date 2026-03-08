import Head from 'next/head';
import React from 'react';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page Not Found</title>
      </Head>
      <div className="not-found">
        <img
          src="/404-bg.jpg"
          alt="Golfers searching for a lost ball in the rough"
          className="not-found-bg"
        />
        <p className="not-found-heading">404 &mdash; Not found</p>
        <p className="not-found-subheading">
          Sorry but we cannot find what you are looking for.
        </p>
        <a href="/" className="not-found-link">
          Return to Home
        </a>
      </div>
    </>
  );
}
