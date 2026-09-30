import crypto from 'crypto';

export const CODE_LENGTH = 4;
export const CODE_TTL_MS = 2 * 60 * 60 * 1000;
export const MAX_FAILED_ATTEMPTS = 5;

export function normalizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export function generateCode() {
  return `${crypto.randomInt(10 ** (CODE_LENGTH - 1), 10 ** CODE_LENGTH)}`;
}

// Returns one of 'ok', 'invalid-code', 'expired' or 'too-many-attempts'.
export function checkCode(attempt, token, now = Date.now()) {
  if (!attempt) {
    return 'invalid-code';
  }
  if (attempt.confirmedAt) {
    return 'expired';
  }
  if (attempt.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return 'too-many-attempts';
  }
  if (now - new Date(attempt.createdAt).getTime() > CODE_TTL_MS) {
    return 'expired';
  }
  if (`${token}`.trim() !== attempt.token) {
    return 'invalid-code';
  }
  return 'ok';
}
