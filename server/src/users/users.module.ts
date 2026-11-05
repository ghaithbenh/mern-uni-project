import { Router } from 'express';
import { createAuthGuard, createRolesGuard } from '../auth/auth.guard.js';
import { asyncHandler } from '../common/http/async-handler.js';
import { writeLimiter } from '../common/middleware/rate-limit.js';
import type { ApiModule } from '../common/module/api-module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

export class UsersModule implements ApiModule {
  readonly path = '/api/users';
  readonly router = Router();
  readonly service = new UsersService();

  constructor() {
    const controller = new UsersController(this.service);
    const authGuard = createAuthGuard(this.service);
    const adminGuard = createRolesGuard('admin');

    this.router.get('/', authGuard, adminGuard, asyncHandler(controller.findAll));
    this.router.patch(
      '/:id/role',
      writeLimiter,
      authGuard,
      adminGuard,
      asyncHandler(controller.updateRole)
    );
  }
}
