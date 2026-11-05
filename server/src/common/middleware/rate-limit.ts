import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

const MINUTE = 60_000;

const createLimiter = (options: LimiterOptions): RequestHandler =>
  rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: options.message },
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
  });

// Garde-fou général : toutes les routes /api.
export const apiLimiter = createLimiter({
  windowMs: MINUTE,
  limit: 240,
  message: 'Trop de requêtes. Réessaie dans une minute.',
});

// Connexion : seules les tentatives échouées comptent, pour ne pas bloquer
// un utilisateur qui se connecte normalement plusieurs fois.
export const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.',
  skipSuccessfulRequests: true,
});

// Inscription : toutes les demandes comptent (anti-spam de comptes).
export const registerLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 10,
  message: 'Trop de créations de comptes. Réessaie plus tard.',
});

// Écritures : publications, suppressions, changements de rôle.
export const writeLimiter = createLimiter({
  windowMs: MINUTE,
  limit: 20,
  message: 'Trop de modifications. Réessaie dans une minute.',
});
