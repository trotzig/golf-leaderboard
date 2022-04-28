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
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Script src="https://hosted.okayanalytics.com/tracker.js?tid=OA-8Z056CCN" />
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
