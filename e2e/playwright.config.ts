import { defineConfig, devices } from '@playwright/test';

// Ports dédiés aux e2e pour ne pas entrer en collision avec `npm run dev`
// du développeur (5000 / 5173).
const PORT_API = 5050;
const PORT_WEB = 5273;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // suites qui se partagent la même base de données
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PORT_WEB}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Deux serveurs : API (Express réel + MongoDB en mémoire) et front Vite.
  webServer: [
    {
      command: `npx tsx -- ./api-boot.ts`,
      cwd: '../e2e',
      env: {
        PORT: String(PORT_API),
        // CORS : l'API n'accepte que ce front — même port que le Vite e2e.
        CLIENT_URL: `http://localhost:${PORT_WEB}`,
      },
      url: `http://localhost:${PORT_API}/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${PORT_WEB} --strictPort`,
      cwd: '../client',
      env: { VITE_API_URL: `http://localhost:${PORT_API}/api` },
      url: `http://localhost:${PORT_WEB}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
