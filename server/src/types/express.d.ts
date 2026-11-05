import type { UserDocument } from '../users/user.model.js';

// Ajoute `req.user` au type Request d'Express, renseigné par le guard JWT.
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
