import bcrypt from 'bcryptjs';
import { signAccessToken } from '../common/auth/jwt.js';
import { isAdmin } from '../common/auth/roles.js';
import type { Role } from '../common/auth/roles.js';
import { AppError } from '../common/errors/app-error.js';
import { env } from '../config/env.js';
import type { UserDocument } from '../users/user.model.js';
import type { UsersService } from '../users/users.service.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    nom: string;
    email: string;
    role: Role;
  };
}

export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  register = async (dto: RegisterDto): Promise<AuthResponse> => {
    const existe = await this.usersService.findByEmail(dto.email);
    if (existe) {
      throw new AppError(409, 'Cet email est déjà utilisé');
    }

    // Hachage : 10 tours de sel
    const hash = await bcrypt.hash(dto.motDePasse, 10);
    const user = await this.usersService.create({
      nom: dto.nom,
      email: dto.email,
      motDePasse: hash,
      role: this.resolveRole(dto.email),
    });

    return this.buildSession(user);
  };

  login = async (dto: LoginDto): Promise<AuthResponse> => {
    const user = await this.usersService.findByEmail(dto.email);
    // Même message dans les deux cas pour ne pas révéler quels emails existent
    if (!user) {
      throw new AppError(401, 'Email ou mot de passe incorrect');
    }

    const ok = await bcrypt.compare(dto.motDePasse, user.motDePasse);
    if (!ok) {
      throw new AppError(401, 'Email ou mot de passe incorrect');
    }

    // Permet de promouvoir un compte existant via ADMIN_EMAILS.
    if (this.isAdminEmail(user.email) && !isAdmin(user.role)) {
      user.role = 'admin';
      await user.save();
    }

    return this.buildSession(user);
  };

  private resolveRole = (email: string): Role => {
    return this.isAdminEmail(email) ? 'admin' : 'user';
  };

  private isAdminEmail = (email: string): boolean => {
    return env.adminEmails.includes(email.toLowerCase());
  };

  private buildSession = (user: UserDocument): AuthResponse => ({
    token: signAccessToken(user._id.toString()),
    user: {
      id: user._id.toString(),
      nom: user.nom,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
    },
  });
}
