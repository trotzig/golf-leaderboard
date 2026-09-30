import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MAX_FAILED_ATTEMPTS,
  checkCode,
  generateCode,
  normalizeEmail,
} from './signIn.mjs';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    assert.equal(normalizeEmail('  Foo.Bar@Example.COM '), 'foo.bar@example.com');
  });

  it('rejects invalid input', () => {
    assert.equal(normalizeEmail(''), null);
    assert.equal(normalizeEmail('foo'), null);
    assert.equal(normalizeEmail('foo@bar'), null);
    assert.equal(normalizeEmail(undefined), null);
  });
});

describe('generateCode', () => {
  it('generates 4-digit codes', () => {
    for (let i = 0; i < 100; i++) {
      assert.match(generateCode(), /^[1-9][0-9]{3}$/);
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
    assert.equal(checkCode(attempt, '1234', now), 'ok');
  });

  it('rejects the wrong code', () => {
    assert.equal(checkCode(attempt, '4321', now), 'invalid-code');
  });

  it('rejects missing attempts', () => {
    assert.equal(checkCode(null, '1234', now), 'invalid-code');
  });

  it('rejects expired codes', () => {
    const old = { ...attempt, createdAt: new Date(now - 3 * 60 * 60 * 1000) };
    assert.equal(checkCode(old, '1234', now), 'expired');
  });

  it('rejects codes that have already been used', () => {
    const used = { ...attempt, confirmedAt: new Date(now) };
    assert.equal(checkCode(used, '1234', now), 'expired');
  });

  it('locks the code after too many failed attempts', () => {
    const locked = { ...attempt, failedAttempts: MAX_FAILED_ATTEMPTS };
    assert.equal(checkCode(locked, '1234', now), 'too-many-attempts');
  });
});
