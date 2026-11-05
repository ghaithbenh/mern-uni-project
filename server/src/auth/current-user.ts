import type { Request } from 'express';
import type { AuthUser } from '../common/auth/roles.js';
import { AppError } from '../common/errors/app-error.js';
import type { UserDocument } from '../users/user.model.js';

export const getCurrentUser = (req: Request): UserDocument => {
  if (!req.user) {
    throw new AppError(401, 'Accès refusé');
  }
  return req.user;
};

export const getAuthUser = (req: Request): AuthUser => {
  const user = getCurrentUser(req);
  return {
    id: user._id.toString(),
    role: user.role === 'admin' ? 'admin' : 'user',
  };
};
