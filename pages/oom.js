import React, { useEffect, useState } from 'react';

import Menu from '../src/Menu';

const NUM_FORMATTER = Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function getEntries(data) {
  const entryKeys = Object.keys(data.Entries);
  return entryKeys.map(key => data.Entries[key]);
}

function Player({ entry }) {
  const [favorite, setFavorite] = useState(
    localStorage.getItem(entry.MemberID),
  );

  useEffect(() => {
    if (favorite) {
      localStorage.setItem(entry.MemberID, '1');
    } else {
      localStorage.removeItem(entry.MemberID);
    }
  }, [favorite, entry]);

  const classes = ['player'];
  if (favorite) {
    classes.push('favorite-player');
  }

  return (
    <li className={classes.join(' ')}>
      <span className="position">
        <span>{entry.Position}</span>
        <button className="favorite" onClick={() => setFavorite(!favorite)}>
          <svg
            height="24px"
            viewBox="0 0 24 24"
            width="24px"
            fill={favorite ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.2)'}
          >
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      </span>
      <span>
        {entry.FirstName} {entry.LastName}
        <br />
        <span className="club">{entry.ClubName}</span>
      </span>
      <span className="score">
        {NUM_FORMATTER.format(Math.round(entry.CalculatedResult))}
      </span>
    </li>
  );
}

export default function OrderOfMeritPage() {
  const [data, setData] = useState();
  useEffect(() => {
    const rndFunctionName = `rnd_${Math.floor(Math.random() * 1000001)}`;
    window[rndFunctionName] = payload => {
      setData(payload);
    };
    const scriptEl = document.createElement('script');
    const url = `https://scores.golfbox.dk/Handlers/OrderOfMeritsHandler/GetOrderOfMerit/CustomerId/1/language/2057/OrderOfMeritID/157709/?callback=${rndFunctionName}&_=${Date.now()}`;
    scriptEl.src = url;
    document.body.appendChild(scriptEl);
  }, []);

  const entries = data && getEntries(data);
  return (
    <div className="leaderboard">
      <Menu />
      <h2>Order of merit</h2>
      {data ? (
        <ul>
          {entries.map(entry => {
            return <Player key={entry.MemberID} entry={entry} />;
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
