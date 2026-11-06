import { afterAll, describe, expect, it, vi } from 'vitest';

// On recharge le module config/env pour chaque test afin de repartir
// d'un process.env maîtrisé (dotenv a déjà absorbé .env / .env.test).
const nettoieEnv = (): void => {
  delete process.env.PORT;
  delete process.env.CLIENT_URL;
  delete process.env.TRUST_PROXY;
  delete process.env.ADMIN_EMAILS;
  delete process.env.MONGO_URI;
  delete process.env.JWT_SECRET;
};

afterAll(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('config/env', () => {
  it('valeur par défaut du port : 5000', async () => {
    nettoieEnv();
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(env.port).toBe(5000);
  });

  it('TRUST_PROXY est converti en nombre', async () => {
    nettoieEnv();
    process.env.TRUST_PROXY = '2';
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(env.trustProxy).toBe(2);
  });

  it('ADMIN_EMAILS : trim + minuscules + filtrage des vides', async () => {
    nettoieEnv();
    process.env.ADMIN_EMAILS = ' Alice@X.com , , bob@y.org ';
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(env.adminEmails).toEqual(['alice@x.com', 'bob@y.org']);
  });

  it('ADMIN_EMAILS vide -> liste vide', async () => {
    nettoieEnv();
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(env.adminEmails).toEqual([]);
  });

  it('mongoUri refuse une chaîne vide (getter paresseux)', async () => {
    nettoieEnv();
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(() => env.mongoUri).toThrow(/MONGO_URI/);
  });

  it('mongoUri rejette le placeholder CLUSTER0_HOST', async () => {
    nettoieEnv();
    process.env.MONGO_URI = 'mongodb+srv://user:<pass>@CLUSTER0_HOST/';
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(() => env.mongoUri).toThrow(/MONGO_URI/);
  });

  it('mongoUri accepte une URI valide', async () => {
    nettoieEnv();
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/lepanneau-test';
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(env.mongoUri).toBe('mongodb://127.0.0.1:27017/lepanneau-test');
  });

  it('jwtSecret exige JWT_SECRET', async () => {
    nettoieEnv();
    vi.resetModules();
    const { env } = await import('../config/env.js');
    expect(() => env.jwtSecret).toThrow(/JWT_SECRET/);
  });
});
