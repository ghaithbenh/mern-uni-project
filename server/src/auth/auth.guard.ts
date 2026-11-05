import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { verifyAccessToken } from '../common/auth/jwt.js';
import type { Role } from '../common/auth/roles.js';
import { AppError } from '../common/errors/app-error.js';
import type { UsersService } from '../users/users.service.js';

// Middleware "sentinelle" : exige un header Authorization: Bearer <token>
export const createAuthGuard = (usersService: UsersService): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.headers.authorization;

      if (!header || !header.startsWith('Bearer ')) {
        throw new AppError(401, 'Accès refusé : token manquant');
      }

      const token = header.slice('Bearer '.length).trim();
      if (!token) {
        throw new AppError(401, 'Accès refusé : token manquant');
      }

      const payload = verifyAccessToken(token);
      const user = await usersService.findById(payload.id);

      if (!user) {
        throw new AppError(401, 'Utilisateur introuvable');
      }

      req.user = user; // disponible dans les contrôleurs protégés
      next();
    } catch (err: unknown) {
      next(err);
    }
  };
};

// À utiliser après createAuthGuard : vérifie que l'utilisateur a un rôle autorisé.
export const createRolesGuard = (...allowed: readonly Role[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Accès refusé');
      }

      const role: Role = req.user.role === 'admin' ? 'admin' : 'user';
      if (!allowed.includes(role)) {
        throw new AppError(403, 'Accès refusé : rôle insuffisant');
      }

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
};
