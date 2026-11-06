import { afterAll, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { AppError } from '../common/errors/app-error.js';
import { env } from '../config/env.js';
import { signAccessToken, verifyAccessToken } from '../common/auth/jwt.js';

afterAll(() => {
  vi.resetModules();
});

const codeDe = (fn: () => unknown): number => {
  try {
    fn();
  } catch (err: unknown) {
    if (err instanceof AppError) return err.statusCode;
    throw err;
  }
  throw new Error('AppError attendu mais non levé');
};

describe('JWT', () => {
  it('signe puis vérifie un token', () => {
    const token = signAccessToken('655f3d1e7a1d2c58a4f00a99');
    const payload = verifyAccessToken(token);
    expect(payload.id).toBe('655f3d1e7a1d2c58a4f00a99');
  });

  it('refuse un token modifié (401)', () => {
    const token = signAccessToken('655f3d1e7a1d2c58a4f00a99');
    expect(codeDe(() => verifyAccessToken(`${token}x`))).toBe(401);
  });

  it('refuse une chaîne arbitraire (401)', () => {
    expect(codeDe(() => verifyAccessToken('pas.un.jwt'))).toBe(401);
  });

  it('refuse un payload sans id (401)', () => {
    // Le secret est celui de .env.test : on forge un payload sans `id`.
    const token = jwt.sign({ autre: 1 }, env.jwtSecret);
    expect(codeDe(() => verifyAccessToken(token))).toBe(401);
  });
});
