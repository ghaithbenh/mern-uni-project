import { Types } from 'mongoose';
import type { AuthUser } from '../common/auth/roles.js';
import { AppError } from '../common/errors/app-error.js';
import { EventModel } from '../events/event.model.js';
import type { CreateFeedbackDto } from './dto/feedbacks.dto.js';
import { FeedbackModel } from './feedback.model.js';
import type { FeedbackDocument } from './feedback.model.js';

export class FeedbacksService {
  findByEvent = async (eventId: string): Promise<FeedbackDocument[]> => {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new AppError(400, 'Identifiant invalide');
    }

    return FeedbackModel.find({ evenement: new Types.ObjectId(eventId) })
      .populate('auteur', 'nom')
      .sort({ createdAt: -1 });
  };

  create = async (dto: CreateFeedbackDto, userId: string): Promise<FeedbackDocument> => {
    const evenementId = new Types.ObjectId(dto.evenement);
    const existe = await EventModel.findById(evenementId);
    if (!existe) {
      throw new AppError(404, 'Événement introuvable');
    }

    const feedback = await FeedbackModel.create({
      texte: dto.texte,
      note: dto.note,
      evenement: evenementId,
      auteur: new Types.ObjectId(userId),
    });
    return feedback.populate('auteur', 'nom');
  };

  remove = async (id: string, actor: AuthUser): Promise<void> => {
    const feedback = await FeedbackModel.findById(id);
    if (!feedback) {
      throw new AppError(404, 'Avis introuvable');
    }

    const estAuteur = feedback.auteur.toString() === actor.id;
    if (!estAuteur && actor.role !== 'admin') {
      throw new AppError(403, 'Tu ne peux supprimer que tes avis');
    }

    await feedback.deleteOne();
  };

  removeByEvent = async (eventId: Types.ObjectId): Promise<void> => {
    await FeedbackModel.deleteMany({ evenement: eventId });
  };
}
