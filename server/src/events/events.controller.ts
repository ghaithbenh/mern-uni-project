import type { Request, Response } from 'express';
import { getAuthUser } from '../auth/current-user.js';
import type { FeedbacksService } from '../feedbacks/feedbacks.service.js';
import { parseCreateEventDto } from './dto/events.dto.js';
import type { EventsService } from './events.service.js';

export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly feedbacksService: FeedbacksService
  ) {}

  findAll = async (_req: Request, res: Response): Promise<void> => {
    const events = await this.eventsService.findAll();
    res.json(events);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const utilisateur = getAuthUser(req);
    const dto = parseCreateEventDto(req.body);
    const event = await this.eventsService.create(dto, utilisateur.id);
    res.status(201).json(event);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const utilisateur = getAuthUser(req);
    await this.eventsService.remove(req.params.id, utilisateur);
    res.json({ message: 'Événement supprimé' });
  };

  findFeedbacks = async (req: Request, res: Response): Promise<void> => {
    const feedbacks = await this.feedbacksService.findByEvent(req.params.id);
    res.json(feedbacks);
  };
}
