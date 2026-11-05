import { Router } from 'express';
import { createAuthGuard, createRolesGuard } from '../auth/auth.guard.js';
import { asyncHandler } from '../common/http/async-handler.js';
import type { ApiModule } from '../common/module/api-module.js';
import type { UsersModule } from '../users/users.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

export class AdminModule implements ApiModule {
  readonly path = '/api/admin';
  readonly router = Router();

  constructor(usersModule: UsersModule) {
    const service = new AdminService();
    const controller = new AdminController(service);
    const authGuard = createAuthGuard(usersModule.service);
    const adminGuard = createRolesGuard('admin');

    this.router.get('/stats', authGuard, adminGuard, asyncHandler(controller.getStats));
  }
}
