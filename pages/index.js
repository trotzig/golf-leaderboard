import { startOfDay, parse, format } from 'date-fns';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import Menu from '../src/Menu';
import competitionDateString from '../src/competitionDateString';
import fetchJsonP from '../src/fetchJsonP';

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

function getCompetitions(data, now) {
  const result = [];
  for (const c of Object.values(data.CompetitionData)) {
    for (const m of Object.values(c.Months)) {
      result.push(...Object.values(m.Entries));
    }
  }
  for (const entry of result) {
    entry._start = parse(entry.StartDate, DATE_FORMAT, now);
    entry._end = parse(entry.EndDate, DATE_FORMAT, now);
  }
  return result;
}

export default function StartPage() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function run() {
      setLoading(true);
      const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/`;
      const payload = await fetchJsonP(url);
      setData(payload);
      setLoading(false);
    }
    run();
  }, []);
  // const now = startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const now = startOfDay(new Date());
  const competitions = data ? getCompetitions(data, now) : [];

  const pastCompetitions = competitions.filter(c => c._end < now);
  const currentCompetitions = competitions.filter(
    c => c._start <= now && c._end >= now,
  );
  const upcomingCompetitions = competitions.filter(c => now < c._start);

  return (
    <div className="chrome">
      <Menu
        defaultCompetitionId={data && data.DefaultCompetition.CompetitionID}
      />
      <div className="competitions">
        <h2>Competitions</h2>
        {loading ? (
          <div className="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        ) : (
          <>
            {currentCompetitions.length > 0 && (
              <>
                <h3>Current</h3>
                <ul>
                  {currentCompetitions.map(c => (
                    <CompetitionListItem
                      key={c.ID}
                      competition={c}
                      now={now}
                      current
                    />
                  ))}
                </ul>
              </>
            )}
            {upcomingCompetitions.length > 0 && (
              <>
                <h3>Upcoming</h3>
                <ul>
                  {upcomingCompetitions.map(c => (
                    <CompetitionListItem key={c.ID} competition={c} now={now} />
                  ))}
                </ul>
              </>
            )}
            {pastCompetitions.length > 0 && (
              <>
                <h3>Past events</h3>
                <ul>
                  {pastCompetitions.map(c => (
                    <CompetitionListItem key={c.ID} competition={c} now={now} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CompetitionListItem({ competition, now, current }) {
  const queryString = now > competition._end ? '?finished=1' : '';
  return (
    <li
      key={competition.ID}
      className={
        current ? 'competition-list-item current' : 'competition-list-item'
      }
    >
      <Link href={`/competitions/${competition.ID}${queryString}`}>
        <a className="competition">
          <div className="calendar-event">
            <b>{format(competition._start, 'd')}</b>
            <span>{format(competition._start, 'MMM')}</span>
          </div>
          <div>
            <h4>
              <span>{competition.Name}</span>
            </h4>
            <p>{competitionDateString(competition, now)}</p>
          </div>
        </a>
      </Link>
    </li>
  );
}
