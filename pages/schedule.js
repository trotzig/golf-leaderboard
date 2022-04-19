import { format, startOfDay } from 'date-fns';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { getAllCompetitions } from '../src/staticData.js';
import Menu from '../src/Menu';

export default function SchedulePage() {
  const [competitions, setCompetitions] = useState([]);
  const now = startOfDay(new Date());
  const currentCompetition = competitions.find(
    c => c.start <= now && c.end >= now,
  );

  useEffect(() => {
    setCompetitions(getAllCompetitions());
  }, []);

  return (
    <div className="chrome">
      <Menu
        defaultCompetitionId={currentCompetition && currentCompetition.id}
      />
      <div className="schedule">
        <h2>Tour schedule</h2>
        <table className="results-table page-margin">
          <thead>
            <tr>
              <th>Event</th>
              <th>Dates</th>
            </tr>
          </thead>
          {competitions.length > 0 && (
            <tbody>
              {competitions.map(c => (
                <CompetitionItem key={c.id} competition={c} now={now} />
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

function CompetitionItem({ competition, now, current }) {
  const queryString = now > competition.end ? '?finished=1' : '';
  return (
    <tr
      key={competition.id}
      className={
        current ? 'competition-list-item current' : 'competition-list-item'
      }
    >
      <td>
        <Link href={`/competitions/${competition.id}${queryString}`}>
          <a>
            {competition.name}
            <br />
          </a>
        </Link>
        <span className="schedule-venue">{competition.venue}</span>
      </td>
      <td>
        {format(competition.start, 'MMM d')} —{' '}
        {format(competition.end, 'MMM d')}
      </td>
    </tr>
  );
}
