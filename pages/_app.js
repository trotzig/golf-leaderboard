import Head from 'next/head';
import Script from 'next/script';

import '../styles.css';
import '../loading.css';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Head>
        <title>Moregolf Mastercard Tour</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Script src="https://hosted.okayanalytics.com/tracker.js?tid=OA-8Z056CCN" />
      <Component {...pageProps} />
      <footer>
        by <a href="https://github.com/trotzig/golf-leaderboard">@trotzig</a>
      </footer>
    </div>
  );
}

export default MyApp;
