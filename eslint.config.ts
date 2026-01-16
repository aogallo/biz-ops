import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginReact from 'eslint-plugin-react'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {ignores: ['**/dist/**', '**/node_modules/**', '**/build/**', '**/.react-router/**']},
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },

  tseslint.configs.recommended,

  pluginReact.configs.flat.recommended,
  // ✅ React Router / React 17+ JSX runtime
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },

  // MUST be last
  eslintConfigPrettier,
])
