import {
  differenceInDays,
  startOfDay,
  formatDistance,
  parse,
  format,
  getDate,
} from 'date-fns';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import Menu from '../src/Menu';
import fetchJsonP from '../src/fetchJsonP';

const DATE_FORMAT = "yyyyMMdd'T'HHmmss";

function getCompetitions(data, now) {
  const result = [];
  for (const c of Object.values(data.CompetitionData)) {
    for (const m of Object.values(c.Months)) {
      result.push(...Object.values(m.Entries));
    }
  }
  result.forEach(comp => {
    comp.start = parse(comp.StartDate, DATE_FORMAT, now);
    comp.end = parse(comp.EndDate, DATE_FORMAT, now);
  });
  return result;
}

function dateString(competition, now) {
  const start = competition.start;
  const end = competition.end;
  const numberOfDays = differenceInDays(end, start);
  const startDay = getDate(start);
  const endDay = getDate(end);

  if (numberOfDays > 4) {
    // If the entry spans more than 4 days, we assume it's a "Sign up" entry.
    // These will show the entire date.
    if (endDay < startDay) {
      // crossing into different month
      return `${format(start, 'MMMM d')}—${format(end, 'MMMM d')}`;
    }
    return `${format(start, 'MMMM d')}—${format(end, 'd')}`;
  }

  if (start <= now && now <= end) {
    // Currently active
    return `Currently playing round ${differenceInDays(now, start) + 1} of ${
      numberOfDays + 1
    }`;
  }

  if (now > end) {
    return `Finished ${formatDistance(end, now)} ago`;
  }
  const daysUntilStart = differenceInDays(start, now);
  if (daysUntilStart === 1) {
    return 'Starts tomorrow';
  }
  if (daysUntilStart < 8) {
    return `Starts in ${formatDistance(now, start)}`;
  }
  if (endDay < startDay) {
    // crossing into different month
    return `${format(start, 'MMMM d')}—${format(end, 'MMMM d')}`;
  }
  return `${format(start, 'MMMM d')}—${format(end, 'd')}`;
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
  console.log(competitions);

  return (
    <div className="chrome">
      <Menu />
      <div className="competitions">
        <h2>Competitions</h2>
        {competitions ? (
          <ul>
            {competitions.map(c => {
              const badge =
                c.start <= now && now <= c.end
                  ? 'current'
                  : now > c.end
                  ? 'completed'
                  : 'upcoming';
              return (
                <li key={c.ID} className={badge}>
                  <Link href={`/competitions/${c.ID}`}>
                    <a className="competition">
                      <div className="calendar-event">
                        <b>{format(c.start, 'd')}</b>
                        <span>{format(c.start, 'MMM')}</span>
                      </div>
                      <div>
                        <h4>
                          <span>{c.Name}</span>
                        </h4>
                        <p>{dateString(c, now)}</p>
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
