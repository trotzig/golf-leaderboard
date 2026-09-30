import { describe, expect, it } from 'vitest';

import {
  MAX_FAILED_ATTEMPTS,
  checkCode,
  generateCode,
  normalizeEmail,
} from './signIn.mjs';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo.Bar@Example.COM ')).toBe('foo.bar@example.com');
  });

  it('rejects invalid input', () => {
    expect(normalizeEmail('')).toBe(null);
    expect(normalizeEmail('foo')).toBe(null);
    expect(normalizeEmail('foo@bar')).toBe(null);
    expect(normalizeEmail(undefined)).toBe(null);
  });
});

describe('generateCode', () => {
  it('generates 4-digit codes', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateCode()).toMatch(/^[1-9][0-9]{3}$/);
    }
  });
});

describe('checkCode', () => {
  const now = new Date('2026-06-01T12:00:00Z').getTime();
  const attempt = {
    token: '1234',
    createdAt: new Date(now - 60 * 1000),
    confirmedAt: null,
    failedAttempts: 0,
  };

  it('accepts the right code', () => {
    expect(checkCode(attempt, '1234', now)).toBe('ok');
  });

  it('rejects the wrong code', () => {
    expect(checkCode(attempt, '4321', now)).toBe('invalid-code');
  });

  it('rejects missing attempts', () => {
    expect(checkCode(null, '1234', now)).toBe('invalid-code');
  });

  it('rejects expired codes', () => {
    const old = { ...attempt, createdAt: new Date(now - 3 * 60 * 60 * 1000) };
    expect(checkCode(old, '1234', now)).toBe('expired');
  });

  it('rejects codes that have already been used', () => {
    const used = { ...attempt, confirmedAt: new Date(now) };
    expect(checkCode(used, '1234', now)).toBe('expired');
  });

  it('locks the code after too many failed attempts', () => {
    const locked = { ...attempt, failedAttempts: MAX_FAILED_ATTEMPTS };
    expect(checkCode(locked, '1234', now)).toBe('too-many-attempts');
  });
});
