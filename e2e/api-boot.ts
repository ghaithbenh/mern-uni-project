// Démarre l'API réelle (Express) contre un MongoDB en mémoire, pour Playwright.
//
// Important : mongoose n'est PAS importé ici. La copie `mongoose` vue par
// le code serveur (server/node_modules) serait une instance différente de
// celle vue depuis e2e/ — un piège classique de double package. On démarre
// donc le vrai point d'entrée `server/src/main.ts` après avoir défini
// MONGO_URI, et c'est lui qui connecte SA copie de mongoose.

// Variables fixées avant tout import dynamique, pour que config/env.ts
// lise exactement les valeurs voulues.
process.env.JWT_SECRET ??= 'e2e-jwt-secret-not-for-production';
process.env.ADMIN_EMAILS ??= 'patron@e2e.local';
process.env.TRUST_PROXY ??= '0';

async function start(): Promise<void> {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();

  // Connecte le mongoose du serveur, puis crée l'app et écoute sur PORT.
  await import('../server/src/main.js');
}

await start();
