import React, { useEffect, useState } from 'react';
import Link from 'next/link';

function getCompetitions(data) {
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
    const rndFunctionName = `rnd_${Math.floor(Math.random() * 1000001)}`;
    window[rndFunctionName] = payload => {
      setData(payload);
    };
    const scriptEl = document.createElement('script');
    const url = `https://scores.golfbox.dk/Handlers/ScheduleHandler/GetSchedule/CustomerId/1/Season/2022/CompetitionId/0/language/2057/?callback=${rndFunctionName}&_=${Date.now()}`;
    scriptEl.src = url;
    document.body.appendChild(scriptEl);
  }, []);
  const competitions = data && getCompetitions(data);

  return (
    <div className="competitions">
      <h2>Competitions</h2>
      {competitions ? (
        <ul>
          {competitions.map(c => {
            return (
              <li key={c.ID}>
                <Link href={`/${c.ID}/3066464/0`}>
                  <a>{c.Name}</a>
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
