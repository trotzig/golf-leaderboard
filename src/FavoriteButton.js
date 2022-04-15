import React, { useEffect, useState } from 'react';

export default function FavoriteButton({
  onChange = () => {},
  playerId,
  large,
  lastFavoriteChanged,
}) {
  const [isFavorite, setFavorite] = useState();
  useEffect(() => {
    setFavorite(localStorage.getItem(playerId));
  }, [lastFavoriteChanged]);

  useEffect(() => {
    if (typeof isFavorite === 'undefined') {
      // first render
      return;
    }
    if (isFavorite) {
      localStorage.setItem(playerId, '1');
    } else {
      localStorage.removeItem(playerId);
    }
    onChange(isFavorite);
  }, [isFavorite, playerId]);

  const icon = (
    <svg height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
      <path d="M0 0h24v24H0z" fill="none" stroke="none" />
      <path d="M0 0h24v24H0z" fill="none" stroke="none" />
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );

  const clickHandler = e => {
    e.preventDefault();
    setFavorite(!isFavorite);
    fetch(`/api/favorites/${playerId}`, {
      method: !isFavorite ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
  const classes = ['favorite-button'];
  if (isFavorite) {
    classes.push('is-favorite');
  }

  if (large) {
    classes.push('favorite-button-large');
    classes.push('icon-button');
    return (
      <button
        className={classes.join(' ')}
        style={{
          backgroundColor: isFavorite ? 'var(--primary)' : undefined,
          color: isFavorite ? '#fff' : undefined,
          borderColor: isFavorite ? 'var(--primary)' : 'currentColor',
          minWidth: 170,
        }}
        onClick={clickHandler}
      >
        {icon}
        {isFavorite ? 'Favorite' : 'Add to favorites'}
      </button>
    );
  }

  return (
    <button className={classes.join(' ')} onClick={clickHandler}>
      {icon}
    </button>
  );
}
