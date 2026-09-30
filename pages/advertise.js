import Head from 'next/head';
import React from 'react';

import prisma from '../src/prisma.mjs';

// Plausible has no API key configured, so this is updated by hand from the
// Plausible dashboard.
const MONTHLY_VISITORS = '40K';

const CONTACT_EMAIL = 'henric@happo.io';

const NUM_FORMATTER = Intl.NumberFormat('en-US');

function Stat({ value, label }) {
  return (
    <div className="advertise-stat">
      <div className="advertise-stat-value">{value}</div>
      <div className="advertise-stat-label">{label}</div>
    </div>
  );
}

export default function Advertise({
  subscriberCount,
  playerCount,
  competitionCount,
  year,
}) {
  return (
    <div className="advertise-page">
      <Head>
        <title>Advertise – Nordic Golf Tour</title>
        <meta
          name="description"
          content="Reach engaged Nordic golf fans on nordicgolftour.app, the live scores site for the Cutter & Buck Tour."
        />
      </Head>
      <h2>Advertise</h2>
      <p className="page-desc">
        Put your brand in front of the people who follow Nordic professional
        golf most closely: players, their families and clubs, and golf fans
        across Sweden, Denmark, Norway and Finland.
      </p>

      <div className="advertise-stats">
        <Stat value={MONTHLY_VISITORS} label="monthly visitors" />
        <Stat
          value={NUM_FORMATTER.format(subscriberCount)}
          label="email subscribers"
        />
        <Stat value={NUM_FORMATTER.format(playerCount)} label="players tracked" />
        <Stat
          value={NUM_FORMATTER.format(competitionCount)}
          label={`tournaments in ${year}`}
        />
      </div>

      <section className="about-section">
        <h3>The audience</h3>
        <p>
          nordicgolftour.app is where fans follow live scores, standings and
          their favorite players on the Cutter &amp; Buck Tour. Visitors come
          back again and again during tournament weeks, checking the leaderboard
          between shots and after every round. The season runs from spring to
          autumn, with traffic peaking around each event.
        </p>
      </section>

      <section className="about-section">
        <h3>Placements</h3>
        <ul className="advertise-placements">
          <li>
            <strong>Homepage sponsor</strong>
            <p>
              A prominent placement on the start page, seen by nearly every
              visitor.
            </p>
          </li>
          <li>
            <strong>Leaderboard presented by</strong>
            <p>
              Your brand alongside the live leaderboard, the most-viewed page
              during tournaments.
            </p>
          </li>
          <li>
            <strong>Email sponsor</strong>
            <p>
              A sponsor line in the notifications subscribers receive when their
              favorite players tee off, get hot or finish a round.
            </p>
          </li>
        </ul>
        <p>
          Placements are exclusive, one sponsor at a time, and can be booked for
          a tournament week, a month or the full season.
        </p>
      </section>

      <section className="about-section">
        <h3>Get in touch</h3>
        <p>
          For pricing and availability, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Advertising%20on%20nordicgolftour.app`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  );
}

export async function getServerSideProps({ res }) {
  const year = new Date().getFullYear();
  const [subscriberCount, playerCount, competitionCount] = await Promise.all([
    prisma.account.count(),
    prisma.player.count(),
    prisma.competition.count({
      where: {
        visible: true,
        start: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
    }),
  ]);

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  );

  return {
    props: { subscriberCount, playerCount, competitionCount, year },
  };
}
