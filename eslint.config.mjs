// eslint.config.mjs (pragmatique - moins bloquant localement)
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'dist/**',
      'src/generated/**',
      'postcss.config.mjs', // Ignore postcss config
      'eslint.config.mjs', // Ignore eslint config itself
      'tests/**', // Ignore temporairement les tests
      'scripts/**', // Ignore les scripts utilitaires
      '**/*.test.js', // Ignore tous les fichiers de test
      '**/*.test.ts',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
    rules: {
      // 🔒 SÉCURITÉ CRITIQUE - ERREURS
      '@typescript-eslint/no-floating-promises': 'error', // Promises non gérées = failles
      '@typescript-eslint/ban-ts-comment': 'error', // @ts-ignore cache les problèmes
      'no-debugger': 'error', // Jamais en prod
      'no-var': 'error', // var = scope dangereux
      '@typescript-eslint/no-explicit-any': 'warn', // any = pas de validation type

      // 🛡️ BONNES PRATIQUES - WARNINGS
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn', // ! peut crasher
      'react-hooks/exhaustive-deps': 'warn', // useEffect dependencies
      'react-hooks/rules-of-hooks': 'error', // Hooks mal utilisés

      // ❌ STYLE DÉSACTIVÉ (non-bloquant)
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/lib/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/components/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'off',
      'prefer-template': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // React / JSX
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-boolean-value': 'off',
      'react/jsx-curly-brace-presence': 'off',

      // Accessibility / Next specifics
      'jsx-a11y/anchor-is-valid': 'off',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  // Overrides : tests et scripts peuvent être moins stricts
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'scripts/**',
      'src/tests/**',
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': 'off',
    },
  },
  {
    files: [
      'src/lib/core/env.ts',
      'src/lib/core/logger.ts',
      'src/middleware.ts',
      'src/app/api/**/route.ts',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
  {
    files: [
      'src/lib/middleware/types.ts',
      'src/lib/integrations/shippo/client.ts',
      'src/components/admin/products/product-shipping-info.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;
