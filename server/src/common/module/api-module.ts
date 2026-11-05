import type { Router } from 'express';

// Contrat commun à tous les modules exposant des routes HTTP.
export interface ApiModule {
  readonly path: string;
  readonly router: Router;
}
