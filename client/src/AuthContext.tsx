import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import api from './api';
import type { AuthResponse, Role, User } from './types';

export interface AuthContextValue {
  user: User | null;
  login: (email: string, motDePasse: string) => Promise<void>;
  register: (nom: string, email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const isRole = (value: unknown): value is Role => value === 'user' || value === 'admin';

// Garde de type : on ne fait confiance à ce qui vient du localStorage
// qu'après avoir vérifié sa forme.
const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.nom === 'string' &&
    typeof candidate.email === 'string' &&
    isRole(candidate.role)
  );
};

const readStoredUser = (): User | null => {
  const saved = localStorage.getItem('user');
  if (!saved) return null;

  try {
    const parsed: unknown = JSON.parse(saved);
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Session restaurée depuis localStorage au chargement de la page
  const [user, setUser] = useState<User | null>(readStoredUser);

  const saveSession = (data: AuthResponse): void => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email: string, motDePasse: string): Promise<void> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, motDePasse });
    saveSession(data);
  };

  const register = async (nom: string, email: string, motDePasse: string): Promise<void> => {
    const { data } = await api.post<AuthResponse>('/auth/register', { nom, email, motDePasse });
    saveSession(data);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
