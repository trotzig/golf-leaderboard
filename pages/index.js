import React, { useEffect, useState } from 'react';

function getEntries(data) {
  const classKey = Object.keys(data.Classes)[0];
  const entries = data.Classes[classKey].Leaderboard.Entries;
  const entryKeys = Object.keys(entries);
  return entryKeys.map(key => entries[key]);
}

function getRounds(entry) {
  const roundKeys = Object.keys(entry.Rounds);
  return roundKeys.map(key => entry.Rounds[key]);
}

function fixParValue(val) {
  if (val === 'Par') {
    return 'E';
  }
  return val;
}

function Round({ round }) {
  return (
    <div className="round">
      {Object.keys(round.Holes).map((holeKey, i) => {
        const score = round.HoleScores[holeKey];
        const toParClass = !score
          ? 'unknown'
          : score.Result.ToParValue < -1
          ? 'eagle'
          : score.Result.ToParValue < 0
          ? 'birdie'
          : score.Result.ToParValue > 1
          ? 'bogey-plus'
          : score.Result.ToParValue > 0
          ? 'bogey'
          : 'on-par';
        const result = [
          <span key={holeKey} className={`round-score ${toParClass}`}>
            {score ? score.Result.ActualText : '-'}
          </span>,
        ];
        return result;
      })}
    </div>
  );
}

function Player({ entry }) {
  const rounds = getRounds(entry);

  return (
    <li className="player">
      <span className="position">{entry.Position.Calculated}</span>
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
        {fixParValue(entry.ResultSum.ToParText)}
      </span>
      <span className="stats" style={{ maxHeight: open ? 100 : 0 }}>
        {rounds.map(round => {
          return <Round key={round.RefID} round={round} />;
        })}
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
