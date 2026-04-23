module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: '18.3',
    },
  },
  rules: {
    // Relaxed rules for initial CI setup - can tighten later
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'off',
    // eslint-plugin-react-hooks@7 enables React Compiler rules that the current codebase
    // is not yet migrated to. Keep core hooks rules enabled, but disable compiler-enforcement
    // rules so staging CI can gate on actual runtime/build issues first.
    'react-hooks/immutability': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/purity': 'off',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/static-components': 'off',
  },
};
