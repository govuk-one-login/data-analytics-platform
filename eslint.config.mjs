import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginVitest from 'eslint-plugin-vitest';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginImport from 'eslint-plugin-import';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.mjs', '**/*.js', '**/*.ts'],
    plugins: {
      import: eslintPluginImport,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      // ESM enforcement: prohibit CommonJS require() calls
      'import/no-commonjs': 'error',
      // ESM enforcement: warn on relative imports without .js extension (forward-looking for bundler-resolved projects)
      'import/extensions': ['warn', 'ignorePackages', { ts: 'never', js: 'always', mjs: 'always' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ...eslintPluginVitest.configs['recommended'],
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
