import { AppError } from '../../common/errors/app-error.js';
import type { Role } from '../../common/auth/roles.js';
import { asRecord } from '../../common/validation/fields.js';

export interface UpdateRoleDto {
  role: Role;
}

export const parseUpdateRoleDto = (body: unknown): UpdateRoleDto => {
  const data = asRecord(body);

  if (data.role !== 'user' && data.role !== 'admin') {
    throw new AppError(400, 'Rôle invalide');
  }

  return { role: data.role };
};
