import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    ignores: ['dist/', 'dev-dist/', 'node_modules/', 'public/', 'coverage/'],
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['src/**/*.{js,svelte}'],
    rules: {
      complexity: ['error', 4],
    },
  },
  {
    files: ['**/*.test.js', 'src/test/**'],
    rules: {
      complexity: 'off',
    },
  },
  prettier,
  ...svelte.configs.prettier,
]
