import { Types } from 'mongoose';
import type { AuthUser } from '../common/auth/roles.js';
import { AppError } from '../common/errors/app-error.js';
import type { FeedbacksService } from '../feedbacks/feedbacks.service.js';
import type { CreateEventDto } from './dto/events.dto.js';
import { EventModel } from './event.model.js';
import type { EventDocument } from './event.model.js';

export class EventsService {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  findAll = async (): Promise<EventDocument[]> => {
    return EventModel.find().populate('auteur', 'nom').sort({ date: 1 });
  };

  create = async (dto: CreateEventDto, userId: string): Promise<EventDocument> => {
    const event = await EventModel.create({
      ...dto,
      auteur: new Types.ObjectId(userId),
    });
    return event.populate('auteur', 'nom');
  };

  remove = async (id: string, actor: AuthUser): Promise<void> => {
    const event = await EventModel.findById(id);
    if (!event) {
      throw new AppError(404, 'Événement introuvable');
    }

    const estAuteur = event.auteur.toString() === actor.id;
    if (!estAuteur && actor.role !== 'admin') {
      throw new AppError(403, 'Tu ne peux supprimer que tes événements');
    }

    // On nettoie les avis liés avant de supprimer l'événement
    await this.feedbacksService.removeByEvent(event._id);
    await event.deleteOne();
  };
}
