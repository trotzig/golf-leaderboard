import '../styles.css';
import '../loading.css';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Component {...pageProps} />
      <footer>
        by <a href="https://github.com/trotzig/golf-leaderboard">@trotzig</a>
      </footer>
      <script
        async
        src="https://hosted.okayanalytics.com/tracker.js?tid=OA-8Z056CCN"
      ></script>
    </div>
  );
}

export default MyApp;
