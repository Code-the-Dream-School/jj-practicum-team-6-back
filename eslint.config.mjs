import globals from 'globals';
import js from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      prettier: pluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...configPrettier.rules,
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'consistent-return': 'error',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 100,
          semi: true,
        },
      ],
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
];
