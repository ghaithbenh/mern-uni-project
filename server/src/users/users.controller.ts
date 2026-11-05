import type { Request, Response } from 'express';
import type { Role } from '../common/auth/roles.js';
import { getAuthUser } from '../auth/current-user.js';
import { parseUpdateRoleDto } from './dto/users.dto.js';
import type { UserDocument } from './user.model.js';
import type { UsersService } from './users.service.js';

interface AdminUserResponse {
  id: string;
  nom: string;
  email: string;
  role: Role;
}

const toAdminUser = (user: UserDocument): AdminUserResponse => ({
  id: user._id.toString(),
  nom: user.nom,
  email: user.email,
  role: user.role === 'admin' ? 'admin' : 'user',
});

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  findAll = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.usersService.findAll();
    res.json(users.map(toAdminUser));
  };

  updateRole = async (req: Request, res: Response): Promise<void> => {
    const actor = getAuthUser(req);
    const dto = parseUpdateRoleDto(req.body);
    const user = await this.usersService.updateRole(req.params.id, dto.role, actor.id);
    res.json(toAdminUser(user));
  };
}
