import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { ROLES } from '../common/auth/roles.js';
import type { Role } from '../common/auth/roles.js';

const userSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Contiendra le hash bcrypt, jamais le mot de passe en clair
    motDePasse: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'user', required: true },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema> & { role: Role };
export type UserDocument = HydratedDocument<User>;

export const UserModel = model('User', userSchema);
