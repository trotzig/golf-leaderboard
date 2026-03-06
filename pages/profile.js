import React, { useEffect, useState } from 'react';

import PlayerPhoto from '../src/PlayerPhoto';
import SignInForm from '../src/SignInForm';
import profileProps from '../src/profileProps.js';
import syncFavorites from '../src/syncFavorites';

export default function ProfilePage({ account }) {
  const [sendEmailOnFinished, setSendEmailOnFinished] = useState(
    account ? account.sendEmailOnFinished : false,
  );
  const [sendEmailOnStart, setSendEmailOnStart] = useState(
    account ? account.sendEmailOnStart : false,
  );
  const [sendEmailOnHotStreak, setSendEmailOnHotStreak] = useState(
    account ? account.sendEmailOnHotStreak : false,
  );
  const [favorites, setFavorites] = useState(account ? account.favorites : []);
  const [removedFavorites, setRemovedFavorites] = useState([]);

  useEffect(() => {
    if (!account) {
      return;
    }
    async function run() {
      await fetch('/api/account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sendEmailOnFinished,
          sendEmailOnStart,
          sendEmailOnHotStreak,
        }),
      });
    }
    run();
  }, [sendEmailOnFinished, sendEmailOnStart, sendEmailOnHotStreak]);

  async function removeFavorite(playerId) {
    const player = favorites.find(p => p.id === playerId);
    setFavorites(favorites.filter(p => p.id !== playerId));
    setRemovedFavorites(prev => [...prev, player]);
    localStorage.removeItem(playerId);
    await fetch(`/api/favorites/${playerId}`, { method: 'DELETE' });
  }

  async function undoRemoveFavorite(playerId) {
    const player = removedFavorites.find(p => p.id === playerId);
    setRemovedFavorites(prev => prev.filter(p => p.id !== playerId));
    setFavorites(prev => [...prev, player]);
    await fetch(`/api/favorites/${playerId}`, { method: 'PUT' });
  }

  return (
    <div className="profile">
      <h2>Your profile</h2>
      <div className="page-margin">
        {account ? (
          <div className="profile-signed-in">
            <p>
              Signed in as <b>{account.email}</b>
            </p>
            <a href="/api/auth/logout" className="icon-button">
              Sign out
            </a>
          </div>
        ) : (
          <div className="profile-signed-out">
            <SignInForm title="Sign in to change settings" />
          </div>
        )}
      </div>

      {account && (
        <div className="profile-favorites">
          <h2>Favorites</h2>
          {favorites.length === 0 ? (
            <div className="page-margin">
              No favorites yet. <a href="/players">Browse players</a> to add
              favorites.
            </div>
          ) : (
            <div className="page-margin profile-favorites-grid">
              {favorites.map(player => (
                <div key={player.id} className="profile-favorite">
                  <a href={`/${player.slug}`}>
                    <PlayerPhoto player={player} />
                    <span className="profile-favorite-name">
                      {player.firstName} {player.lastName}
                    </span>
                  </a>
                  <button
                    className="profile-favorite-remove"
                    onClick={() => removeFavorite(player.id)}
                    aria-label={`Remove ${player.firstName} ${player.lastName} from favorites`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {removedFavorites.length > 0 && (
            <div className="page-margin profile-favorites-undo">
              {removedFavorites.map(player => (
                <div key={player.id} className="profile-favorite-undo-item">
                  <span>
                    {player.firstName} {player.lastName} removed.
                  </span>
                  <button
                    className="profile-favorite-undo-button"
                    onClick={() => undoRemoveFavorite(player.id)}
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h2>Notifications</h2>
      <div className="page-margin">
        <div className="profile-settings">
          <label className="profile-setting">
            <span>
              <b>Finished round:</b> Send an email when a favorite player
              finishes a round
            </span>
            <input
              className="ios-switch"
              type="checkbox"
              disabled={!account}
              checked={sendEmailOnFinished}
              onChange={e => {
                setSendEmailOnFinished(e.target.checked);
                syncFavorites();
              }}
            />
          </label>
          <label className="profile-setting">
            <span>
              <b>Started round:</b> Send an email when a favorite player starts
              a round
            </span>
            <input
              className="ios-switch"
              type="checkbox"
              disabled={!account}
              checked={sendEmailOnStart}
              onChange={e => {
                setSendEmailOnStart(e.target.checked);
                syncFavorites();
              }}
            />
          </label>
          <label className="profile-setting">
            <span>
              <b>Eagle alert:</b> Send an email when a player makes an eagle (or
              better).
            </span>
            <input
              className="ios-switch"
              type="checkbox"
              disabled={!account}
              checked={sendEmailOnHotStreak}
              onChange={e => {
                setSendEmailOnHotStreak(e.target.checked);
                syncFavorites();
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export function getServerSideProps({ req }) {
  return profileProps({ req });
}
