import React, { useEffect, useState } from 'react';

import Icon from './Icon';

export default function FavoriteButton({
  onChange = () => {},
  playerId,
  large,
  lastFavoriteChanged,
}) {
  const [isFavorite, setFavorite] = useState();
  // Only animate the star when the user toggles it, not on page load
  const [justToggled, setJustToggled] = useState(false);
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

  const icon = <Icon name="star" />;

  const clickHandler = (confirm, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      if (confirm &&
        !window.confirm(
          `This will remove the player from your list of favorites. Proceed?`,
        )
      ) {
        return;
      }
    }
    setFavorite(!isFavorite);
    setJustToggled(true);
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
  if (justToggled) {
    classes.push('favorite-button-toggled');
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
        }}
        onClick={clickHandler.bind(this, true)}
      >
        {icon}
        {isFavorite ? 'Favorite' : 'Add to favorites'}
      </button>
    );
  }

  return (
    <span
      role="button"
      tabIndex="0"
      aria-label="Favorite"
      aria-pressed={Boolean(isFavorite)}
      className={classes.join(' ')}
      onClick={clickHandler.bind(this, false)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') clickHandler(false, e);
      }}
    >
      {icon}
    </span>
  );
}
