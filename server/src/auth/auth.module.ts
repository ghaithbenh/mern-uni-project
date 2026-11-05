import { Router } from 'express';
import { asyncHandler } from '../common/http/async-handler.js';
import { loginLimiter, registerLimiter } from '../common/middleware/rate-limit.js';
import type { ApiModule } from '../common/module/api-module.js';
import type { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

export class AuthModule implements ApiModule {
  readonly path = '/api/auth';
  readonly router = Router();

  constructor(usersModule: UsersModule) {
    const service = new AuthService(usersModule.service);
    const controller = new AuthController(service);

    this.router.post('/register', registerLimiter, asyncHandler(controller.register));
    this.router.post('/login', loginLimiter, asyncHandler(controller.login));
  }
}
