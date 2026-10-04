import '../../styles.css';

import React from 'react';

import SchedulePage from '../SchedulePage.js';
import { competitions2025, competitions2026, players } from './mockData.js';
import withNav from './withNav.js';

// Mimics what getServerSideProps adds: a winner for every event that has
// been played, and the live leaderboard for the ongoing one.
function prepareCompetitions(competitions, now) {
  const day = 24 * 60 * 60 * 1000;
  // SchedulePage converts start/end to Date objects in place.
  return competitions.map((c, i) => {
    const copy = { ...c, winner: null };
    if (c.end + day <= now) {
      const names = [`${players[i].firstName} ${players[i].lastName}`];
      if (i === 3) {
        // A team event has two winners.
        names.push(`${players[20].firstName} ${players[20].lastName}`);
      }
      const score = -(8 + ((i * 5) % 11));
      copy.winner = { names, score, scoreText: String(score) };
    } else if (c.start <= now) {
      copy.finished = false;
      copy.leaderboardEntries = players.slice(10, 15).map((player, pos) => ({
        position: pos + 1,
        positionText: String(pos + 1),
        score: pos - 7,
        scoreText: String(pos - 7),
        hole: String(14 - pos),
        player,
      }));
    }
    return copy;
  });
}

const years = [2024, 2025, 2026];

export default {
  title: 'SchedulePage',
  component: SchedulePage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

// The tour map loads map tiles from a third-party CDN, so it is left out to
// keep screenshots stable.
function Season({ competitions, selectedYear, now }) {
  const nowMs = new Date(now).getTime();
  return (
    <SchedulePage
      competitions={prepareCompetitions(competitions, nowMs)}
      years={years}
      selectedYear={selectedYear}
      now={nowMs}
      showMap={false}
    />
  );
}

export const OngoingEvent = () => (
  <Season
    competitions={competitions2026}
    selectedYear={2026}
    now="2026-07-02T12:00:00"
  />
);

export const BetweenEvents = () => (
  <Season
    competitions={competitions2026}
    selectedYear={2026}
    now="2026-07-10T12:00:00"
  />
);

export const BeforeSeasonStart = () => (
  <Season
    competitions={competitions2026}
    selectedYear={2026}
    now="2026-01-20T12:00:00"
  />
);

export const PreviousSeason = () => (
  <Season
    competitions={competitions2025}
    selectedYear={2025}
    now="2026-07-02T12:00:00"
  />
);
