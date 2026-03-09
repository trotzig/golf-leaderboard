import Head from 'next/head';
import React from 'react';

export default function About() {
  return (
    <div className="about-page">
      <Head>
        <title>About – Nordic Golf Tour</title>
      </Head>
      <h2>About</h2>
      <p className="page-desc">
        An unofficial fan site for the{' '}
        <a href="https://cutterbuck.se/">Cutter &amp; Buck Tour</a>, the Nordic
        professional golf tour for men.
      </p>

      <section className="about-section">
        <h3>Why this site exists</h3>
        <p>
          I built this site because I wanted a better way to follow my friends
          playing on the tour. The official tools weren't great for quickly
          checking live scores and standings, so I made something that works the
          way I wanted.
        </p>
      </section>

      <section className="about-section">
        <h3>Data</h3>
        <p>
          Live scores and leaderboard data are fetched from the GolfBox API and
          updated continuously throughout each tournament round. Statistics may
          be incorrect or delayed — this site is not affiliated with the tour
          and makes no guarantees about accuracy.
        </p>
      </section>

      <section className="about-section">
        <h3>Open source</h3>
        <p>
          This site is open source. You can find the code on{' '}
          <a href="https://github.com/trotzig/golf-leaderboard">GitHub</a>.
          Contributions and bug reports are welcome.
        </p>
      </section>

      <section className="about-section">
        <h3>A note about AI</h3>
        <p>
          Parts of this site were built with help from{' '}
          <a href="https://www.anthropic.com/">Anthropic</a>'s AI, Claude.
        </p>
      </section>

      <section className="about-section">
        <h3>Related links</h3>
        <ul className="about-links">
          <li>
            <a href="https://tournytt.se/tour/cutter-buck-tour">Tournytt</a> —
            news and coverage of the Cutter &amp; Buck Tour
          </li>
          <li>
            <a href="https://cutterbuck.se/">Cutter &amp; Buck</a> — title
            sponsor of the tour
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h3>Contact</h3>
        <p>
          For inquiries about this website, contact me directly at
          henric@happo.io.
        </p>
      </section>
    </div>
  );
}
