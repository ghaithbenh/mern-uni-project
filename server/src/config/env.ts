import 'dotenv/config';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d’environnement manquante : ${name}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Nombre de proxys de confiance devant l'API (0 = aucun).
  // Sur Render/Railway, mettre TRUST_PROXY=1.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,

  // Emails promus automatiquement administrateurs (séparés par des virgules).
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0),

  get mongoUri(): string {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('CLUSTER0_HOST')) {
      throw new Error(
        'MONGO_URI manquant ou encore à remplacer dans server/.env.\n' +
          "Copie .env.example vers .env puis renseigne l'URI de connexion MongoDB."
      );
    }
    return uri;
  },

  get jwtSecret(): string {
    return requireEnv('JWT_SECRET');
  },
} as const;
