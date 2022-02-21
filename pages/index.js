import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  differenceInDays,
  startOfDay,
  formatDistance,
  parse,
  format,
  getDate,
} from 'date-fns';

const DATE_FORMAT = 'yyyyMMdd';

function getCompetitions(data, now) {
  const result = [];
  for (const c of Object.values(data.CompetitionData)) {
    for (const m of Object.values(c.Months)) {
      result.push(...Object.values(m.Entries));
    }
  }
  result.forEach(comp => {
    comp.start = parse(
      comp.StartDate.slice(0, DATE_FORMAT.length),
      DATE_FORMAT,
      now,
    );
    comp.end = parse(
      comp.EndDate.slice(0, DATE_FORMAT.length),
      DATE_FORMAT,
      now,
    );
  });
  return result;
}

function dateString(competition, now) {
  const start = competition.start;
  const end = competition.end;
  const numberOfDays = differenceInDays(start, end);

  if (start <= now && now <= end) {
    // Currently active
    return `Currently playing round ${
      differenceInDays(start, now) - 1
    } of ${numberOfDays}`;
  }

  if (now > end) {
    return `Finished ${formatDistance(end, now)} ago`;
  }
  const daysUntilStart = differenceInDays(start, now);
  if (daysUntilStart < 8) {
    return `Starts in ${formatDistance(now, start)}`;
  }
  const startDay = getDate(start);
  const endDay = getDate(end);
  if (endDay < startDay) {
    // crossing into different month
    return `${format(start, 'MMMM d')}—${format(end, 'MMMM d')}`;
  }
  return `${format(start, 'MMMM d')}—${format(end, 'd')}`;
}

export default function StartPage() {
  const [data, setData] = useState();
  useEffect(() => {
    const rndFunctionName = `rnd_${Math.floor(Math.random() * 1000001)}`;
    window[rndFunctionName] = payload => {
      setData(payload);
    };
    const scriptEl = document.createElement('script');
    const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/?callback=${rndFunctionName}&_=${Date.now()}`;
    scriptEl.src = url;
    document.body.appendChild(scriptEl);
  }, []);
  const now = startOfDay(new Date());
  const competitions = data && getCompetitions(data, now);

  return (
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
                <Link href={`/${c.ID}/3066464/0`}>
                  <a className="competition">
                    <svg
                      viewBox="0 0 24 24"
                      fill="#000000"
                    >
                      <path d="M0 0h24v24H0V0z" fill="none" />
                      <circle cx="19.5" cy="19.5" r="1.5" />
                      <path d="M17 5.92L9 2v18H7v-1.73c-1.79.35-3 .99-3 1.73 0 1.1 2.69 2 6 2s6-.9 6-2c0-.99-2.16-1.81-5-1.97V8.98l6-3.06z" />
                    </svg>
                    <div>
                      <h4>{c.Name}</h4>
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
  );
}
