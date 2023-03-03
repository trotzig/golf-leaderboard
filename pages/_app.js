import '../styles.css';

import Head from 'next/head';
import NextNProgress from 'nextjs-progressbar';
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
      <NextNProgress color="#e54e37" height={2} showOnShallow={false} />
      <Head>
        <title>Nordic Golf Tour</title>
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width, user-scalable=no"
        />
        <meta name="mobile-wep-app-capable" content="yes" />
        <meta name="apple-mobile-wep-app-capable" content="yes" />
        <meta name="theme-color" content={themeColor} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/app-icon-192.png" />
      </Head>
      <Script src="https://hosted.okayanalytics.com/tracker.js?tid=OA-8Z056CCN" />
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3939494656554168"
        crossorigin="anonymous"
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
