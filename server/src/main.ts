import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

const bootstrap = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connecté');

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`Serveur sur le port ${env.port}`);
    });
  } catch (err: unknown) {
    console.error('Erreur au démarrage :', err instanceof Error ? err.message : err);
    process.exit(1);
  }
};

void bootstrap();
