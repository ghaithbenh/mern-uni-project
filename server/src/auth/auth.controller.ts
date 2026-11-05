import type { Request, Response } from 'express';
import type { AuthService } from './auth.service.js';
import { parseLoginDto, parseRegisterDto } from './dto/auth.dto.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const dto = parseRegisterDto(req.body);
    const session = await this.authService.register(dto);
    res.status(201).json(session);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const dto = parseLoginDto(req.body);
    const session = await this.authService.login(dto);
    res.json(session);
  };
}
