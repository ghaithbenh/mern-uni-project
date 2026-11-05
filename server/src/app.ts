import cors from 'cors';
import express from 'express';
import type { Express } from 'express';
import { AppModule } from './app.module.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { notFound } from './common/middleware/not-found.js';
import { apiLimiter } from './common/middleware/rate-limit.js';
import { env } from './config/env.js';

export const createApp = (): Express => {
  const app = express();

  // Derrière un proxy (Render, Railway…), TRUST_PROXY doit être défini
  // pour que req.ip reflète l'adresse réelle du client.
  if (env.trustProxy > 0) {
    app.set('trust proxy', env.trustProxy);
  }

  // CORS : on n'autorise que le front déclaré dans CLIENT_URL
  app.use(cors({ origin: env.clientUrl }));

  // Limitation globale appliquée à toute l'API, avant le parsing du corps.
  app.use('/api', apiLimiter);
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ message: 'API Le Panneau en ligne' });
  });

  const appModule = new AppModule();
  for (const module of appModule.modules) {
    app.use(module.path, module.router);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
