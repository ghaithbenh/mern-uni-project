import { Router } from 'express';
import { createAuthGuard } from '../auth/auth.guard.js';
import { asyncHandler } from '../common/http/async-handler.js';
import { writeLimiter } from '../common/middleware/rate-limit.js';
import type { ApiModule } from '../common/module/api-module.js';
import type { UsersModule } from '../users/users.module.js';
import { FeedbacksController } from './feedbacks.controller.js';
import { FeedbacksService } from './feedbacks.service.js';

export class FeedbacksModule implements ApiModule {
  readonly path = '/api/feedbacks';
  readonly router = Router();
  readonly service: FeedbacksService;

  constructor(usersModule: UsersModule) {
    this.service = new FeedbacksService();
    const controller = new FeedbacksController(this.service);
    const guard = createAuthGuard(usersModule.service);

    this.router.post('/', writeLimiter, guard, asyncHandler(controller.create));
    this.router.delete('/:id', writeLimiter, guard, asyncHandler(controller.remove));
  }
}
