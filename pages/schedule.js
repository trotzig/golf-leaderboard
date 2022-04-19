import { startOfDay, format } from 'date-fns';
import Link from 'next/link';
import React from 'react';

import { useJsonPData } from '../src/fetchJsonP';
import LoadingSkeleton from '../src/LoadingSkeleton';
import Menu from '../src/Menu';
import getCompetitions from '../src/getCompetitions';

export default function SchedulePage() {
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/`,
  );
  const loading = !data;

  const now = startOfDay(new Date());
  const competitions = data ? getCompetitions(data, now) : [];

  return (
    <div className="chrome">
      <Menu
        defaultCompetitionId={
          data &&
          data.DefaultCompetition &&
          data.DefaultCompetition.CompetitionID
        }
      />
      <div className="schedule">
        <h2>Tour schedule</h2>
        {loading ? (
          <LoadingSkeleton />
        ) : (
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
                  <CompetitionItem key={c.ID} competition={c} now={now} />
                ))}
              </tbody>
            )}
          </table>
        )}
      </div>
    </div>
  );
}

function CompetitionItem({ competition, now, current }) {
  const queryString = now > competition._end ? '?finished=1' : '';
  return (
    <tr
      key={competition.ID}
      className={
        current ? 'competition-list-item current' : 'competition-list-item'
      }
    >
      <td>
        <Link href={`/competitions/${competition.ID}${queryString}`}>
          <a>{competition.Name}</a>
        </Link>
      </td>
      <td>{format(competition._start, 'MMM d')} —{' '}
      {format(competition._end, 'MMM d')}</td>
    </tr>
  );
}
