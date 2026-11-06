import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: false, // imports explicites -> TypeScript sûr, pas de `any`
    environment: 'node',
    setupFiles: [path.resolve(import.meta.dirname, 'src/test/setup.ts')],
    // La première exécution télécharge un binaire mongod via mongodb-memory-server.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
