import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginJest from 'eslint-plugin-jest';
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
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ...eslintPluginJest.configs['flat/recommended'],
    rules: {
      ...eslintPluginJest.configs['flat/recommended'].rules,
      'jest/expect-expect': [
        'warn',
        {
          // add testClean (from run-flyway-command test) and testS3Response (from test-support test)
          // as these functions do have expect calls inside but the eslint jest plugin only looks in the top level test itself
          assertFunctionNames: ['expect', 'testClean', 'testS3Response'],
        },
      ],
      'jest/no-standalone-expect': [
        'error',
        {
          // add beforeAll as we do some expects in there in the run-flyway-command test
          additionalTestBlockFunctions: ['beforeAll'],
        },
      ],
    },
  },
];
