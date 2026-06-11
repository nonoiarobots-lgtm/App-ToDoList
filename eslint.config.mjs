import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Fichiers générés — jamais lintés
    'public/sw.js',
    'public/sw.js.map',
    'public/swe-worker-*.js',
    'lib/database.types.ts',
    'coverage/**',
  ]),
  {
    rules: {
      // Les arguments préfixés par _ sont des stubs volontaires (squelettes TDD)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'prefer-const': 'error',
    },
  },
]);

export default eslintConfig;
