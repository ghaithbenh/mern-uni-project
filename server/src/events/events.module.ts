import { Router } from 'express';
import { createAuthGuard } from '../auth/auth.guard.js';
import { asyncHandler } from '../common/http/async-handler.js';
import { writeLimiter } from '../common/middleware/rate-limit.js';
import type { ApiModule } from '../common/module/api-module.js';
import type { FeedbacksModule } from '../feedbacks/feedbacks.module.js';
import type { UsersModule } from '../users/users.module.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

export class EventsModule implements ApiModule {
  readonly path = '/api/events';
  readonly router = Router();

  constructor(usersModule: UsersModule, feedbacksModule: FeedbacksModule) {
    const service = new EventsService(feedbacksModule.service);
    const controller = new EventsController(service, feedbacksModule.service);
    const guard = createAuthGuard(usersModule.service);

    this.router.get('/', asyncHandler(controller.findAll));
    this.router.post('/', writeLimiter, guard, asyncHandler(controller.create));
    this.router.delete('/:id', writeLimiter, guard, asyncHandler(controller.remove));
    this.router.get('/:id/feedbacks', asyncHandler(controller.findFeedbacks));
  }
}
