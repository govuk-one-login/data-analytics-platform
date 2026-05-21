import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginVitest from 'eslint-plugin-vitest';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.mjs', '**/*.js', '**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      vitest: eslintPluginVitest,
    },
    rules: {
      ...eslintPluginVitest.configs['recommended'].rules,
      'vitest/expect-expect': [
        'warn',
        {
          // add testClean (from run-flyway-command test) and testS3Response (from test-support test)
          // as these functions do have expect calls inside but the eslint vitest plugin only looks in the top level test itself
          assertFunctionNames: ['expect', 'testClean', 'testS3Response'],
        },
      ],
      'vitest/no-standalone-expect': [
        'error',
        {
          // add beforeAll as we do some expects in there in the run-flyway-command test
          additionalTestBlockFunctions: ['beforeAll'],
        },
      ],
    },
  },
];
