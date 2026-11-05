import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Identifiant invalide' });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: 'Données invalides' });
    return;
  }

  if (err instanceof SyntaxError) {
    res.status(400).json({ message: 'JSON invalide' });
    return;
  }

  console.error('Erreur non gérée :', err);
  res.status(500).json({ message: 'Erreur serveur' });
};
