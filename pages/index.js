import React, { useEffect, useState } from 'react';

function getEntries(data) {
  const classKey = Object.keys(data.Classes)[0];
  const entries = data.Classes[classKey].Leaderboard.Entries;
  const entryKeys = Object.keys(entries);
  return entryKeys.map(key => entries[key]);
}

function Player({ entry }) {
  return (
    <li key={entry.RefID}>
      <span>{entry.Position.Calculated}</span>
      <span>
        {entry.FirstName} {entry.LastName}
        <br />
        <span className="club">{entry.ClubName}</span>
      </span>
      <span
        className={`to-par${
          entry.ResultSum.ToParValue < 0 ? ' under-par' : ''
        }`}
      >
        {entry.ResultSum.ToParText}
      </span>
    </li>
  );
}

export default function StartPage() {
  const [data, setData] = useState();
  console.log(data);
  useEffect(() => {
    const rndFunctionName = `rnd_${Math.floor(Math.random() * 1000001)}`;
    window[rndFunctionName] = payload => {
      setData(payload);
    };
    const scriptEl = document.createElement('script');
    const url = `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/3176088/ClassId/3066464/RoundNumber/0/language/2057/?callback=${rndFunctionName}&_=1645174112687`;
    scriptEl.src = url;
    document.body.appendChild(scriptEl);
  }, []);
  const entries = data && getEntries(data);
  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <ul>
        {entries &&
          entries.map(entry => {
            return <Player key={entry.RefID} entry={entry} />;
          })}
      </ul>
    </div>
  );
}
