import React, { useEffect, useRef, useState } from 'react';

import CodeInput from './CodeInput.js';
import syncFavorites from './syncFavorites.js';

const CODE_LENGTH = 4;

const ERROR_MESSAGES = {
  'invalid-email': "That doesn't look like a valid email address.",
  'send-failed': "We couldn't send the code. Please try again.",
  'invalid-code': "That code isn't right. Check the email and try again.",
  expired: 'This code has expired. Send a new code to continue.',
  'too-many-attempts':
    'Too many incorrect attempts. Send a new code to continue.',
  unknown: 'Something went wrong. Please try again.',
};

export default function SignInForm({ title = 'Sign in', initialState = {} }) {
  const [step, setStep] = useState(initialState.step || 'email');
  const [email, setEmail] = useState(initialState.email || '');
  const [code, setCode] = useState('');
  const [signInAttemptId, setSignInAttemptId] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialState.error);
  const [notice, setNotice] = useState();
  const codeInputRef = useRef();
  const isConfirming = useRef(false);

  useEffect(() => {
    if (!initialState.email) {
      setEmail(localStorage.getItem('email') || '');
    }
  }, []);

  async function sendCode({ isResend } = {}) {
    setIsSubmitting(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const res = await fetch('/api/auth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        setError(error === 'invalid-email' ? error : 'send-failed');
        return;
      }
      localStorage.setItem('email', email);
      const { id } = await res.json();
      setSignInAttemptId(id);
      setCode('');
      setStep('code');
      if (isResend) {
        setNotice(`We sent a new code to ${email}.`);
        codeInputRef.current?.focus();
      }
    } catch (e) {
      setError('send-failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmCode(token) {
    if (isConfirming.current) {
      return;
    }
    isConfirming.current = true;
    setIsSubmitting(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const res = await fetch('/api/auth/confirm-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signInAttemptId }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        setError(ERROR_MESSAGES[error] ? error : 'unknown');
        setCode('');
        codeInputRef.current?.focus();
        setIsSubmitting(false);
        isConfirming.current = false;
        return;
      }
    } catch (e) {
      setError('unknown');
      setIsSubmitting(false);
      isConfirming.current = false;
      return;
    }
    try {
      await syncFavorites();
    } catch (e) {
      console.error(e);
    }
    // Keep the form in its submitting state until the page has reloaded
    window.location.reload();
  }

  const alert = error ? (
    <p className="alert" role="alert">
      {ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown}
    </p>
  ) : null;

  if (step === 'code') {
    return (
      <div className="sign-in-form">
        <form
          method="POST"
          onSubmit={e => {
            e.preventDefault();
            confirmCode(code);
          }}
        >
          <h4>Check your email</h4>
          <p className="sign-in-form-intro">
            We sent a {CODE_LENGTH}&#8209;digit code to <b>{email}</b>. Enter it
            below. Can't find it? Check your spam folder.
          </p>
          {alert}
          {notice && (
            <p className="sign-in-form-notice" role="status">
              {notice}
            </p>
          )}
          <div className="input-wrapper">
            <CodeInput
              ref={codeInputRef}
              name="token"
              length={CODE_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={confirmCode}
              aria-label={`${CODE_LENGTH}-digit code`}
            />
          </div>
          <button type="submit" className="icon-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="sign-in-form-links">
            <button
              type="button"
              className="sign-in-form-link"
              disabled={isSubmitting}
              onClick={() => sendCode({ isResend: true })}
            >
              Send a new code
            </button>
            <button
              type="button"
              className="sign-in-form-link"
              disabled={isSubmitting}
              onClick={() => {
                setError(undefined);
                setNotice(undefined);
                setStep('email');
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="sign-in-form">
      <form
        method="POST"
        onSubmit={e => {
          e.preventDefault();
          sendCode();
        }}
      >
        <h4>{title}</h4>
        <p className="sign-in-form-intro">
          No password needed — we'll email you a {CODE_LENGTH}&#8209;digit code.
          Signing in keeps your favorites in sync across devices and lets you
          get email updates about them.
        </p>
        {alert}
        <div className="input-wrapper">
          <input
            className="sign-in-form-input"
            type="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </div>
        <button type="submit" className="icon-button" disabled={isSubmitting}>
          {isSubmitting ? 'Sending code…' : 'Send code'}
        </button>
      </form>
    </div>
  );
}
