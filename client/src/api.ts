import axios from 'axios';
import type { ApiMessage } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Intercepteur : avant chaque requête, on ajoute le token JWT s'il existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Petit helper pour extraire le message d'erreur renvoyé par l'API
export const messageErreur = (err: unknown): string => {
  if (axios.isAxiosError<ApiMessage>(err)) {
    return err.response?.data?.message ?? 'Impossible de joindre le serveur';
  }
  return 'Impossible de joindre le serveur';
};

export default api;
