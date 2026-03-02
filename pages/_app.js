import '../styles.css';

import Head from 'next/head';
import { PagesProgressBar as NextNProgress } from 'next-nprogress-bar';
import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import AddToHomeScreen from '../src/AddToHomeScreen.js';
import Menu from '../src/Menu.js';

function getActiveHref(pathname) {
  if (pathname === '/') return '/';
  if (pathname === '/players' || pathname === '/[id]') return '/players';
  if (pathname.startsWith('/t/') || pathname.startsWith('/competitions/'))
    return '/leaderboard';
  if (pathname === '/schedule') return '/schedule';
  if (pathname === '/oom') return '/oom';
  if (pathname === '/profile') return '/profile';
  return undefined;
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [themeColor, setThemeColor] = useState('#ffffff');

  useEffect(() => {
    let fromPathname = null;

    function handleRouteChangeStart() {
      fromPathname = window.location.pathname;
    }

    function handleRouteChangeComplete(url) {
      const toPathname = url.split('?')[0];
      if (fromPathname === toPathname) {
        fromPathname = null;
        return;
      }
      fromPathname = null;
      const main = document.querySelector('main');
      if (!main) return;
      main.style.animation = 'none';
      void main.offsetWidth; // trigger reflow to restart animation
      main.style.animation = '';
    }

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

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
        <meta
          property="og:site_name"
          content={process.env.NEXT_PUBLIC_INTRO_TITLE}
        />
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
      <AddToHomeScreen />
      <Menu activeHref={getActiveHref(router.pathname)} />
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
