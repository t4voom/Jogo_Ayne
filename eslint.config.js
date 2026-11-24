// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Regra de dependência entre camadas (ver docs/adr/0002-arquitetura-em-camadas.md).
 * Cada camada só pode importar das camadas listadas em `allow`.
 * Camadas "de borda" (render, input, ui, main) não têm restrição além de não
 * importarem de main.ts.
 */
const LAYERS = /** @type {const} */ ({
  core: [],
  state: ['core'],
  persistence: ['core'],
  art: ['core'],
  catalog: ['core', 'art'],
  progression: ['core', 'catalog'],
  audio: ['core'],
  fx: ['core'],
  content: ['core'],
});

const ALL_LAYERS = [
  'core',
  'state',
  'persistence',
  'render',
  'input',
  'ui',
  'catalog',
  'art',
  'audio',
  'fx',
  'progression',
  'content',
];

const layerRules = Object.entries(LAYERS).map(([layer, allow]) => {
  const forbidden = ALL_LAYERS.filter((l) => l !== layer && !allow.includes(l));
  return {
    files: [`src/${layer}/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: `^(\\.\\./)+(${forbidden.join('|')})(/|$)`,
              message: `A camada "${layer}" só pode depender de: ${allow.length ? allow.join(', ') : '(nenhuma)'}. Veja docs/adr/0002.`,
            },
            {
              regex: '^(\\.\\./)+main(\\.ts)?$',
              message: 'Ninguém importa de main.ts.',
            },
          ],
        },
      ],
    },
  };
});

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-e2e/**',
      'dev-dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['**/*.test.ts', 'tests/**/*.ts', 'dev/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  ...layerRules,
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.{js,mjs,ts}', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Backend do Google Apps Script (JavaScript V8, escopo global compartilhado).
    files: ['apps-script/**/*.gs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        SpreadsheetApp: 'readonly',
        PropertiesService: 'readonly',
        CacheService: 'readonly',
        LockService: 'readonly',
        ContentService: 'readonly',
        Utilities: 'readonly',
        Logger: 'readonly',
        Session: 'readonly',
      },
    },
    rules: {
      // Funções de topo do Apps Script (doGet, doPost, setup...) são chamadas pelo runtime.
      'no-unused-vars': ['error', { varsIgnorePattern: '^(doGet|doPost|setup|[A-Z_]+)$' }],
    },
  },
  prettier,
);
