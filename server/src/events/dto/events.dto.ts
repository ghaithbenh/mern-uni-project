import { AppError } from '../../common/errors/app-error.js';
import { asRecord, requiredString } from '../../common/validation/fields.js';

export interface CreateEventDto {
  titre: string;
  description: string;
  lieu: string;
  date: Date;
}

export const parseCreateEventDto = (body: unknown): CreateEventDto => {
  const data = asRecord(body);
  const message = 'Tous les champs sont obligatoires';

  const titre = requiredString(data.titre, message);
  const description = requiredString(data.description, message);
  const lieu = requiredString(data.lieu, message);
  const rawDate = requiredString(data.date, message);

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Date invalide');
  }

  return { titre, description, lieu, date };
};
