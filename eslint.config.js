import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.browser },
  },
  {
    ignores: ['apps/*/dist/**', 'apps/*/coverage/**'],
  },
  tseslint.configs.recommended,
  {
    files: ['**/blocks/*.js'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
    languageOptions: {
      globals: {
        ctx: 'readonly',
        canvas: 'readonly',
        width: 'readonly',
        height: 'readonly',
      },
    },
  },
  {
    files: ['**/blocks/templates/*.js'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  eslintConfigPrettier,
]);
