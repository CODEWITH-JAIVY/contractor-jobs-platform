const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { ignores: ['android/**', 'ios/**', 'dist/**', 'tests/**', 'config/**', 'plugins/**'] },
  { files: ['src/**/*.{ts,tsx}', 'App.tsx'], rules: { 'no-console': 'error' } },
  { files: ['*.js', 'scripts/*.cjs'], languageOptions: { globals: { __dirname: 'readonly', process: 'readonly', require: 'readonly', module: 'readonly' } } },
  // Lazy native imports keep Expo Go usable; the API shares its validator with Node tooling.
  { files: ['src/native/*', 'src/api.ts'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
]);
