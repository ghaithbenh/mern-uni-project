// Exécuté avant chaque fichier de test :
// 1. charge .env.test pour ne jamais toucher au vrai .env ni à un vrai MongoDB
// 2. démarre un MongoDB en mémoire partagé par le fichier courant
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { EventModel } from '../events/event.model.js';
import { FeedbackModel } from '../feedbacks/feedback.model.js';
import { UserModel } from '../users/user.model.js';

const envTestPath = fileURLToPath(new URL('../../.env.test', import.meta.url));
config({ path: envTestPath, override: true });

// Filet de sécurité si .env.test venait à disparaître
process.env.JWT_SECRET ??= 'jwt-secret-de-test-non-secure';
process.env.ADMIN_EMAILS ??= 'president@test.local';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    EventModel.deleteMany({}),
    FeedbackModel.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
