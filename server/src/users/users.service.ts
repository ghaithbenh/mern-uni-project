import type { Role } from '../common/auth/roles.js';
import { AppError } from '../common/errors/app-error.js';
import { UserModel } from './user.model.js';
import type { UserDocument } from './user.model.js';

interface CreateUserData {
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
}

export class UsersService {
  findByEmail = async (email: string): Promise<UserDocument | null> => {
    return UserModel.findOne({ email: email.toLowerCase() });
  };

  findById = async (id: string): Promise<UserDocument | null> => {
    return UserModel.findById(id).select('-motDePasse');
  };

  create = async (data: CreateUserData): Promise<UserDocument> => {
    return UserModel.create(data);
  };

  findAll = async (): Promise<UserDocument[]> => {
    return UserModel.find().select('-motDePasse').sort({ createdAt: 1 });
  };

  updateRole = async (
    id: string,
    role: Role,
    actorId: string
  ): Promise<UserDocument> => {
    if (id === actorId) {
      throw new AppError(400, 'Tu ne peux pas changer ton propre rôle');
    }

    const user = await UserModel.findById(id);
    if (!user) {
      throw new AppError(404, 'Utilisateur introuvable');
    }

    if (user.role === 'admin' && role === 'user') {
      const admins = await UserModel.countDocuments({ role: 'admin' });
      if (admins <= 1) {
        throw new AppError(400, 'Impossible de retirer le dernier administrateur');
      }
    }

    user.role = role;
    await user.save();
    return user;
  };
}

export const usersService = new UsersService();
