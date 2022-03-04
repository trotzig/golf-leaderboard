import { useRouter } from 'next/router';
import React from 'react';

import { useJsonPData } from '../../../../../src/fetchJsonP';
import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';
import fixParValue from '../../../../../src/fixParValue';

function getPlayer(data, playerId) {
  const clazz = Object.values(data.Classes)[0];
  const p = Object.values(clazz.Leaderboard.Entries).find(
    e => e.MemberID === playerId,
  );
  return p;
}

export default function CompetitionPlayer() {
  const router = useRouter();
  const { competitionId, playerId } = router.query;

  const data = useJsonPData(
    competitionId &&
      `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
  );

  const loading = !data;
  console.log(data);
  const courseName = data && data.CompetitionData.Name;
  const player = data && getPlayer(data, playerId);
  return (
    <div>
      <Menu />
      <div className="player-profile">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="player-profile-top page-margin">
              <div>
                <b>Player</b>
                <div className="player-profile-name">
                  {player.FirstName} {player.LastName}
                </div>
                <span className="player-profile-club">{player.ClubName}</span>
              </div>

              <span className="player-profile-position">
                <b>Position</b>
                <span>{player.Position && player.Position.Calculated}</span>
              </span>
              <span
                className={`player-profile-topar${
                  player.ResultSum.ToParValue < 0 ? ' under-par' : ''
                }`}
              >
                <b>Result</b>
                <span>{fixParValue(player.ResultSum.ToParText)}</span>
              </span>
            </div>
            <h3>{courseName}</h3>
          </>
        )}
      </div>
    </div>
  );
}
