import { AppError } from '../../common/errors/app-error.js';
import { asRecord, requiredString } from '../../common/validation/fields.js';

export interface RegisterDto {
  nom: string;
  email: string;
  motDePasse: string;
}

export interface LoginDto {
  email: string;
  motDePasse: string;
}

export const parseRegisterDto = (body: unknown): RegisterDto => {
  const data = asRecord(body);
  const message = 'Tous les champs sont obligatoires';

  const nom = requiredString(data.nom, message);
  const email = requiredString(data.email, message);
  const motDePasse = requiredString(data.motDePasse, message);

  if (motDePasse.length < 6) {
    throw new AppError(400, 'Mot de passe : 6 caractères minimum');
  }

  return { nom, email, motDePasse };
};

export const parseLoginDto = (body: unknown): LoginDto => {
  const data = asRecord(body);
  const message = 'Email et mot de passe requis';

  return {
    email: requiredString(data.email, message),
    motDePasse: requiredString(data.motDePasse, message),
  };
};
