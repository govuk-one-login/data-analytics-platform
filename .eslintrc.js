module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'standard-with-typescript', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'no-console': 'error',
    '@typescript-eslint/no-unsafe-argument': 'off',
  },
};
