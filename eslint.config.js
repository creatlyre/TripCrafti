import pluginReact from 'eslint-plugin-react';
import reactCompiler from 'eslint-plugin-react-compiler';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';

import eslintPluginAstro from 'eslint-plugin-astro';

import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off',
  },
});

const jsxA11yConfig = tseslint.config({
  files: ['**/*.{js,jsx,ts,tsx}'],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ['**/*.{js,jsx,ts,tsx}'],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    'react-hooks': eslintPluginReactHooks,
    'react-compiler': reactCompiler,
  },
  settings: { react: { version: 'detect' } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    'react/react-in-jsx-scope': 'off',
    'react-compiler/react-compiler': 'error',
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  baseConfig,
  jsxA11yConfig,
  reactConfig,
  eslintPluginAstro.configs['flat/recommended'],
  {
    plugins: {
      perfectionist,
      // Custom local plugin namespace
      'local-i18n': {
        rules: {
          'no-hardcoded-jsx-text': (await import('./eslint-rules/no-hardcoded-jsx-text.js')).default,
        },
      },
    },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          newlinesBetween: 'always',
          groups: [
            'type',
            'react',
            'astro',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
          customGroups: {
            value: {
              react: ['react', 'react-*'],
              astro: ['astro', 'astro-*'],
            },
          },
          // Use a safe regex (plugin treats values as patterns) to match our alias imports
          internalPattern: ['^@/'],
        },
      ],
      // Enforce i18n discipline: disallow raw JSX text except in ignored contexts
      'local-i18n/no-hardcoded-jsx-text': [
        'error',
        {
          allow: [
            // very common short tokens / UI fragments we intentionally allow
            'OK',
            'AI',
            'USD',
            'EUR',
            'PLN',
            'GBP',
            'CSV',
            'Util%',
            '%',
            'TripCrafti',
            'TripCrafti Logo',
            'h-10',
          ],
          ignoreFiles: ['i18n.ts', 'i18n.test', 'node_modules', '.test.', 'tests', '__mocks__'],
          minLength: 3,
        },
      ],
    },
  },
  eslintPluginPrettier,
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          singleQuote: true,
        },
      ],
    },
  }
);

// Add an override to relax aggressive import sorting in tests while keeping production code strict
export const overrides = [
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}', '**/*.test.{ts,tsx,js,jsx}'],
    rules: {
      'perfectionist/sort-imports': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      // (future) escalate to error after cleanup cycle if desired
      'local-i18n/no-hardcoded-jsx-text': [
        'error',
        {
          allow: ['OK', 'AI', 'USD', 'EUR', 'PLN', 'GBP', 'CSV', 'Util%', '%', 'TripCrafti', 'TripCrafti Logo', 'h-10'],
          ignoreFiles: ['i18n.ts', 'node_modules', '__mocks__'],
          minLength: 3,
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react/prop-types': 'off',
    },
  },
];
