import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

interface AccessTokenPayload {
  id: string;
}

export const signAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, 'Token invalide ou expiré');
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !('id' in decoded) ||
    typeof decoded.id !== 'string'
  ) {
    throw new AppError(401, 'Token invalide ou expiré');
  }

  return { id: decoded.id };
};
