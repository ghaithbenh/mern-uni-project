// Configuration ESLint plate (ESLint 9) : lint tout le monorepo d'un coup.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'e2e/test-results/**',
      'e2e/playwright-report/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Le projet interdit expressément le type `any`.
    files: ['{client,server}/src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },

  {
    // Les fichiers de test : laxistes sur les valeurs de fixture.
    files: ['**/__tests__/**', 'server/src/test/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  }
);
