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
  return result;
}

export default function StartPage() {
  const [data, setData] = useState();
  useEffect(() => {
    async function run() {
      const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/`;
      const payload = await fetchJsonP(url);
      setData(payload);
    }
    run();
  }, []);
  // const now = startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const now = startOfDay(new Date());
  const competitions = data && getCompetitions(data, now);

  return (
    <div className="chrome">
      <Menu
        defaultCompetitionId={data && data.DefaultCompetition.CompetitionID}
      />
      <div className="competitions">
        <h2>Competitions</h2>
        {competitions ? (
          <ul>
            {competitions.map(c => {
              const start = parse(c.StartDate, DATE_FORMAT, now);
              const end = parse(c.EndDate, DATE_FORMAT, now);
              const badge =
                start <= now && now <= end
                  ? 'current'
                  : now > end
                  ? 'completed'
                  : 'upcoming';
              return (
                <li key={c.ID} className={badge}>
                  <Link href={`/competitions/${c.ID}`}>
                    <a className="competition">
                      <div className="calendar-event">
                        <b>{format(start, 'd')}</b>
                        <span>{format(start, 'MMM')}</span>
                      </div>
                      <div>
                        <h4>
                          <span>{c.Name}</span>
                        </h4>
                        <p>{competitionDateString(c, now)}</p>
                      </div>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        )}
      </div>
    </div>
  );
}
