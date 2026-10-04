import '../../styles.css';

import React from 'react';

import SchedulePage from '../SchedulePage.js';
import { competitions2025, competitions2026, players } from './mockData.js';
import withNav from './withNav.js';

function podiumEntry(player, position, score) {
  return {
    position,
    positionText: String(position),
    score,
    scoreText: String(score),
    player,
  };
}

// Mimics what getServerSideProps adds: the top three for every event that has
// been played, the live leaderboard for the ongoing one, and the last visit
// to the venue for some of the events still to come.
function prepareCompetitions(competitions, now) {
  const day = 24 * 60 * 60 * 1000;
  // SchedulePage converts start/end to Date objects in place.
  return competitions.map((c, i) => {
    const copy = { ...c, podium: [] };
    const score = -(8 + ((i * 5) % 11));
    if (c.end + day <= now) {
      // One event has no stored results, like team events.
      if (i !== 3) {
        copy.podium = [0, 1, 2].map(pos =>
          podiumEntry(players[(i + pos * 7) % players.length], pos + 1, score + pos),
        );
      }
    } else if (c.start <= now) {
      copy.finished = false;
      copy.leaderboardEntries = players.slice(10, 15).map((player, pos) => ({
        ...podiumEntry(player, pos + 1, pos - 7),
        hole: String(14 - pos),
      }));
    } else if (i % 2 === 0) {
      copy.lastVisit = {
        name: c.name,
        slug: c.slug.replace(/\d+$/, '2025'),
        year: 2025,
        podium: [podiumEntry(players[i], 1, score)],
      };
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
