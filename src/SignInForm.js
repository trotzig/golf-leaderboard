import React, { useEffect, useState } from 'react';

let interval;

export default function SignInForm({ onSuccess }) {
  const [email, setEmail] = useState();
  const [signInAttemptId, setSignInAttemptId] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] =
    useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    setEmail(localStorage.getItem('email'));
  }, []);

  useEffect(() => {
    if (!isWaitingForConfirmation) {
      clearInterval(interval);
    } else {
      interval = setInterval(async () => {
        console.log('Checking if account is confirmed');
        const res = await fetch(
          '/api/auth/check',

          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ signInAttemptId }),
          },
        );
        if (res.ok) {
          clearInterval(interval);
          setIsDone(true);
          setIsWaitingForConfirmation(false);
          setSignInAttemptId();
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isWaitingForConfirmation, signInAttemptId]);

  return (
    <div className="sign-in-form">
      {error && (
        <p className="alert">
          Something went wrong. Try again or send an email to
          henric.trotzig@gmail.com for support!
        </p>
      )}
      {isDone ? (
        <div className="sign-in-done">
          <h4>Success</h4>
          <p>You are now signed in!</p>
          <a href="/profile" className="icon-button">
            Continue
          </a>
        </div>
      ) : isWaitingForConfirmation ? (
        <div className="sign-in-waiting">
          <h4>One more step</h4>
          <p>
            Check your inbox and follow the instructions in the email to verify
            your email address.
          </p>
          <p><b>Status:</b> <i>waiting for confirmation...</i></p>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            setIsWaitingForConfirmation(false);
          }}>Cancel</a>
        </div>
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
              body: JSON.stringify({ email }),
            });
            localStorage.setItem('email', email);
            setIsSubmitting(false);
            if (!res.ok) {
              setError(true);
              return;
            }
            const { id } = await res.json();
            setSignInAttemptId(id);
            setIsWaitingForConfirmation(true);
          }}
        >
          <h4>Sign in</h4>
          <input
            type="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={isSubmitting}
            required
          />
          <button type="submit" className="icon-button" disabled={isSubmitting}>
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
