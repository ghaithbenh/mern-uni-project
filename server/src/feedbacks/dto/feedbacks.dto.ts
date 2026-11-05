import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { asRecord, requiredNumber, requiredString } from '../../common/validation/fields.js';

export interface CreateFeedbackDto {
  texte: string;
  note: number;
  evenement: string;
}

export const parseCreateFeedbackDto = (body: unknown): CreateFeedbackDto => {
  const data = asRecord(body);
  const message = 'Texte, note et événement requis';

  const texte = requiredString(data.texte, message);
  const note = requiredNumber(data.note, message);
  const evenement = requiredString(data.evenement, message);

  if (note < 1 || note > 5) {
    throw new AppError(400, 'La note doit être entre 1 et 5');
  }

  if (!Types.ObjectId.isValid(evenement)) {
    throw new AppError(400, 'Données invalides');
  }

  return { texte, note, evenement };
};
