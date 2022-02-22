import { parse, format } from 'date-fns';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import ClockIcon from '../../../../src/ClockIcon';
import Menu from '../../../../src/Menu';

function getEntries(data) {
  if (!data.Classes) {
    return;
  }
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
  const now = new Date();
  const startTime = parse(round.StartDateTime, "yyyyMMdd'T'HHmmss", now);

  return (
    <div className="round">
      {now < startTime ? (
        <div className="round-start-time">{format(startTime, 'HH:mm')}</div>
      ) : (
        Object.keys(round.Holes).map((holeKey, i) => {
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
        })
      )}
    </div>
  );
}

function getFirstRoundStart(round) {
  const now = new Date();
  const startTime = parse(round.StartDateTime, "yyyyMMdd'T'HHmmss", now);
  return startTime;
}

function Player({ entry }) {
  const rounds = getRounds(entry);
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
        <span>
          {entry.Position.Calculated || (
            <ClockIcon date={getFirstRoundStart(rounds[0])} />
          )}
        </span>
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
      <span
        className={`score${
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
  const router = useRouter();
  const { competitionId, classId, roundNumber } = router.query;
  useEffect(() => {
    if (!competitionId) {
      return;
    }
    const rndFunctionName = `rnd_${Math.floor(Math.random() * 1000001)}`;
    window[rndFunctionName] = payload => {
      setData(payload);
    };
    const scriptEl = document.createElement('script');
    const url = `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/?callback=${rndFunctionName}&_=${Date.now()}`;
    scriptEl.src = url;
    document.body.appendChild(scriptEl);
  }, [competitionId, classId, roundNumber]);
  console.log(data);
  const entries = data && getEntries(data);
  return (
    <div className="leaderboard">
      <Menu />
      <h2>Leaderboard</h2>
      {data && (
        <h3>
          {data.CompetitionData.Name} – {data.CompetitionData.Venue.Name}
        </h3>
      )}
      {data && !data.Classes ? (
        <p className="alert">This competition hasn't started yet</p>
      ) : entries ? (
        <ul>
          {entries.map(entry => {
            return <Player key={entry.RefID} entry={entry} />;
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
