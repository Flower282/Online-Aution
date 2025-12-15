import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**']
  },

  // Base configuration for all JS/JSX files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    settings: {
      react: {
        version: '19.1' // Updated to match your React version
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // React recommended rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // ==================== CUSTOM RULES ====================
      
      // React 19 doesn't require PropTypes (use TypeScript instead)
      'react/prop-types': 'off',
      
      // Allow apostrophes and quotes in JSX text
      'react/no-unescaped-entities': 'off',
      
      // Disable target blank warning (already off in original config)
      'react/jsx-no-target-blank': 'off',
      
      // Warn about unused variables (errors are too strict during development)
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      
      // React Refresh - warn instead of error
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      
      // Warn about function reassignment (potential bugs)
      'no-func-assign': 'warn',
      
      // Allow constant conditions in certain contexts
      'no-constant-condition': ['warn', { checkLoops: false }]
    }
  }
];
