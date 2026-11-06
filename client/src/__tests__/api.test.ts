import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import type { ApiMessage } from '../types';
import { messageErreur } from '../api';

const erreurAvecRéponse = (data?: ApiMessage): AxiosError<ApiMessage> => {
  const response: AxiosResponse<ApiMessage> = {
    data: data ?? ({} as ApiMessage),
    status: 403,
    statusText: 'Forbidden',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
};

describe('messageErreur', () => {
  it('affiche le message renvoyé par l’API', () => {
    expect(
      messageErreur(erreurAvecRéponse({ message: 'Accès refusé : rôle insuffisant' }))
    ).toBe('Accès refusé : rôle insuffisant');
  });

  it('affiche un message générique si l’API ne renvoie pas de contenu', () => {
    expect(messageErreur(erreurAvecRéponse())).toBe('Impossible de joindre le serveur');
  });

  it('gère une erreur réseau sans réponse', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(messageErreur(err)).toBe('Impossible de joindre le serveur');
  });

  it('gère une erreur classique', () => {
    expect(messageErreur(new Error('boom'))).toBe('Impossible de joindre le serveur');
  });

  it('gère une chaîne arbitraire', () => {
    expect(messageErreur('plain text')).toBe('Impossible de joindre le serveur');
  });
});
