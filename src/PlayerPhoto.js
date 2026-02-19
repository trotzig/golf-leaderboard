import React from 'react';

export default function PlayerPhoto({ player, size = 150 }) {
  const id = player.id || player.MemberID;
  const name =
    (player.firstName || player.FirstName) +
    ' ' +
    (player.lastName || player.LastName);
  return (
    <div className="player-photo-wrap" style={{ width: size, height: size }}>
      <div
        className="player-photo"
        role="img"
        aria-label={name}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(/players/${id}.jpg), url(/players/${id}.png)`,
        }}
      />
    </div>
  );
}
