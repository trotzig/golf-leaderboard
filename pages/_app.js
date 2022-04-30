import Head from 'next/head';
import Script from 'next/script';
import NextNProgress from 'nextjs-progressbar';

import '../styles.css';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <NextNProgress color="#e54e37" height={2} showOnShallow={false} />
      <Head>
        <title>Moregolf Mastercard Tour</title>
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width, user-scalable=no"
        />
        <meta name="mobile-wep-app-capable" content="yes" />
        <meta name="apple-mobile-wep-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/app-icon-192.png" />
      </Head>
      <Script src="https://hosted.okayanalytics.com/tracker.js?tid=OA-8Z056CCN" />
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
