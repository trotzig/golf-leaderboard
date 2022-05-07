import React, { useEffect, useState } from 'react';

import CodeInput from './CodeInput.js';
import syncFavorites from './syncFavorites.js';

let interval;

export default function SignInForm({
  title = 'Sign in',
  favoritedPlayerId,
}) {
  const [email, setEmail] = useState();
  const [isSuccess, setIsSuccess] = useState(false);
  const [signInAttemptId, setSignInAttemptId] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    setEmail(localStorage.getItem('email'));
  }, []);

  return (
    <div className="sign-in-form">
      {error && (
        <p className="alert">
          {error === 'invalid-code' ? (
            <>That's not the right 4-digit code</>
          ) : (
            <>
              Something went wrong. Try again or send an email to
              henric.trotzig@gmail.com for support!
            </>
          )}
        </p>
      )}
      {isSuccess ? (
        <>
          <h4>Success!</h4>
          <p>You are now signed in.</p>
        </>
      ) : signInAttemptId ? (
        <form
          method="POST"
          onSubmit={async e => {
            e.preventDefault();
            setIsSubmitting(true);
            setError(undefined);
            const token = e.target.querySelector('input').value;
            const res = await fetch(`/api/auth/confirm-code`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token, signInAttemptId }),
            });
            setIsSubmitting(false);
            if (res.status === 400) {
              setError('invalid-code');
              return;
            }
            if (!res.ok) {
              setError(true);
              return;
            }
            setIsSuccess(true);
            await syncFavorites();
            window.location.reload();
          }}
        >
          <h4>Enter code</h4>
          <p>Check your email for a 4-digit code to enter here</p>
          <div className="input-wrapper">
            <CodeInput name="token" length={4} />
          </div>
          <button type="submit" className="icon-button" disabled={isSubmitting}>
            Sign in
          </button>
        </form>
      ) : (
        <form
          method="POST"
          onSubmit={async e => {
            e.preventDefault();
            setIsSubmitting(true);
            setError(undefined);
            const email = e.target.querySelector('input').value;
            const res = await fetch(`/api/auth/init`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, favoritedPlayerId }),
            });
            localStorage.setItem('email', email);
            setIsSubmitting(false);
            if (!res.ok) {
              setError(true);
              return;
            }
            const { id } = await res.json();
            setSignInAttemptId(id);
          }}
        >
          <h4>{title}</h4>
          <div className="input-wrapper">
            <input
              className="sign-in-form-input"
              type="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isSubmitting}
              required
            />
          </div>
          <button type="submit" className="icon-button" disabled={isSubmitting}>
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
