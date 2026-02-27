import '../styles.css';

import Head from 'next/head';
import { PagesProgressBar as NextNProgress } from 'next-nprogress-bar';
import React, { useEffect, useState } from 'react';
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  const [themeColor, setThemeColor] = useState('#ffffff');
  useEffect(() => {
    console.log('Setting theme color');
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setThemeColor('#222222');
    } else {
      setThemeColor('#ffffff');
    }
  }, [Component]);
  return (
    <div>
      <NextNProgress color="var(--primary)" height={2} showOnShallow={false} />
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE}</title>
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width, user-scalable=no"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Nordic Golf Tour" />
        <meta name="theme-color" content={themeColor} />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:site_name" content={process.env.NEXT_PUBLIC_INTRO_TITLE} />
        <meta name="twitter:card" content="summary" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        {process.env.NEXT_PUBLIC_EXTRA_CSS ? (
          <link rel="stylesheet" href={process.env.NEXT_PUBLIC_EXTRA_CSS} />
        ) : null}
      </Head>
      <Script
        defer
        data-domain={
          process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'nordicgolftour.app'
        }
        src="https://plausible.io/js/script.js"
      />
      <div className="blurry-background" />
      <main>
        <Component {...pageProps} />
      </main>
      <footer>
        by <a href="https://github.com/trotzig/golf-leaderboard">@trotzig</a>
      </footer>
    </div>
  );
}

export default MyApp;
