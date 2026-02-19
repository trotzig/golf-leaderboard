import React from 'react';

export default function PlayerPhoto({ player }) {
  const id = player.id || player.MemberID;
  const name =
    (player.firstName || player.FirstName) +
    ' ' +
    (player.lastName || player.LastName);
  return (
    <div className="player-photo-wrap">
      <div
        className="player-photo"
        role="img"
        aria-label={name}
        style={{
          backgroundImage: `url(/players/${id}.jpg), url(/players/${id}.png)`,
        }}
      />
    </div>
  );
}
