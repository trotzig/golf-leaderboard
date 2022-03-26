import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { findPlayer } from '../src/staticData';
import Menu from '../src/Menu';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const player = id ? findPlayer(id) : null;
  const [isFavorite, setIsFavorite] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState();
  useEffect(() => {
    if (!player) {
      return;
    }
    setIsFavorite(localStorage.getItem(player.memberId));
    setIsSubscribed(localStorage.getItem(`sub-${player.memberId}`));
  }, [player]);

  useEffect(() => {
    if (!player) {
      return;
    }
    if (isFavorite) {
      localStorage.setItem(player.memberId, '1');
    } else {
      localStorage.removeItem(player.memberId);
    }
  }, [isFavorite, player]);
  useEffect(() => {
    if (!player) {
      return;
    }
    const key = `sub-${player.memberId}`;
    if (isSubscribed) {
      localStorage.setItem(key, '1');
    } else {
      localStorage.removeItem(key);
    }
  }, [isSubscribed, player]);
  return (
    <div className="player-page">
      <Head>
        {player ? (
          <title>
            {player.firstName} {player.lastName}
          </title>
        ) : null}
      </Head>
      <Menu />
      {player ? (
        <>
          <div className="player-page-top">
            <div>
              <h2>
                {player.firstName} {player.lastName}
              </h2>
              <p className="player-page-club">{player.clubName}</p>
            </div>
            <Link href="/oom">
              <a className="player-page-oom">
                <b>{player.oomPosition}</b>
                Order of merit
              </a>
            </Link>
          </div>
          <div className="page-margin" style={{ marginBottom: 30 }}>
            <button
              className="icon-button"
              style={{
                backgroundColor: isFavorite ? 'var(--primary)' : undefined,
                color: isFavorite ? '#fff' : undefined,
                borderColor: isFavorite ? 'var(--primary)' : 'currentColor',
                minWidth: 170,
              }}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <svg
                style={{ fill: 'currentColor' }}
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
              >
                <path d="M0 0h24v24H0z" fill="none" stroke="none" />
                <path d="M0 0h24v24H0z" fill="none" stroke="none" />
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {isFavorite ? 'Favorite' : 'Add to favorites'}
            </button>
          </div>
          {isFavorite && (
            <div className="sub-form page-margin">
              {isSubscribed ? (
                <div>
                  <p>You are subscribed to updates from {player.firstName}.</p>
                  <button
                    className="icon-button"
                    onClick={async () => {
                      setIsSubscribed(false);
                      await fetch(`/api/players/${player.memberId}/subscribe`, {
                        method: 'DELETE',
                      });
                    }}
                  >
                    Unsubscribe
                  </button>
                </div>
              ) : (
                <form
                  method="POST"
                  onSubmit={async e => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    const email = e.target.querySelector('input').value;
                    const res = await fetch(
                      `/api/players/${player.memberId}/subscribe`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email }),
                      },
                    );
                    if (!res.ok) {
                      setError(true);
                    } else {
                      setIsSubscribed(true);
                    }
                    setIsSubmitting(false);
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>Subscribe</h4>
                  {error && (
                    <p className="alert">
                      Something went wrong. Try again or send an email to
                      henric.trotzig@gmail.com for support!
                    </p>
                  )}
                  <p>
                    Sign up to get email updates when {player.firstName}{' '}
                    competes on the tour!
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="submit"
                    className="icon-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
