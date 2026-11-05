import type { Request, Response } from 'express';
import { getAuthUser } from '../auth/current-user.js';
import { parseCreateFeedbackDto } from './dto/feedbacks.dto.js';
import type { FeedbacksService } from './feedbacks.service.js';

export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const utilisateur = getAuthUser(req);
    const dto = parseCreateFeedbackDto(req.body);
    const feedback = await this.feedbacksService.create(dto, utilisateur.id);
    res.status(201).json(feedback);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const utilisateur = getAuthUser(req);
    await this.feedbacksService.remove(req.params.id, utilisateur);
    res.json({ message: 'Avis supprimé' });
  };
}
