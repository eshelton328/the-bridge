// The one ESLint config of the repository (d-080, d-085). Each message
// names the fix, because agents fix a lint error in one round when it says
// what to use instead. The layer rules come from web/src/structure.ts.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import eslintReact from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import storybook from 'eslint-plugin-storybook'
import panda from '@pandacss/eslint-plugin'
import router from '@tanstack/eslint-plugin-router'
import boundaries from 'eslint-plugin-boundaries'
import checkFile from 'eslint-plugin-check-file'
import globals from 'globals'
import {
  errorLayer,
  layerPaths,
  layers,
  pageLayers,
  paneSlotFile,
  propsOnlyBans,
  propsOnlyGlobals,
  propsOnlyLayers,
  storeLayer,
} from './web/src/structure.ts'

const tsFiles = ['**/*.{ts,tsx}']
const webFiles = ['web/src/**/*.{ts,tsx}', 'web/.storybook/**/*.{ts,tsx}']
const nodeFiles = ['scripts/**/*.ts', '*.ts', 'web/*.ts', 'web/.storybook/main.ts', 'server/src/**/*.ts', 'e2e/**/*.ts']

// Type syntax that no typescript-eslint rule covers (from the library).
const typeSyntax = [
  {
    selector: 'PropertyDefinition[definite=true], VariableDeclarator[definite=true]',
    message:
      'A definite-assignment assertion ("!:") claims a value is set without a check. Initialise it, or type it as "T | undefined" and check before use.',
  },
]

// Type safety (toolkit rule type-safety.md), as in the library's eslint.shared.js.
const typeRules = {
  '@eslint-community/eslint-comments/no-use': 'error',
  '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-type-assertion': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
  ],
  '@typescript-eslint/switch-exhaustiveness-check': [
    'error',
    // A default after every member is handled is dead code (audit G-1).
    { considerDefaultExhaustiveForUnions: false, allowDefaultCaseForExhaustiveSwitch: false },
  ],
  // stylisticTypeChecked prefers x! here, which no-non-null-assertion bans (audit G-2).
  '@typescript-eslint/non-nullable-type-assertion-style': 'off',
  // One way to write an object type, as the library does.
  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  // TanStack Router's notFound() and redirect() are thrown by design.
  '@typescript-eslint/only-throw-error': [
    'error',
    {
      allow: [{ from: 'package', package: '@tanstack/router-core', name: ['NotFoundError', 'Redirect'] }],
    },
  ],
}

// Bans for web/src. React 19 reports through errors/ only.
const webSyntax = [
  ...typeSyntax,
  {
    selector: "JSXAttribute[name.name='style']",
    message: 'Inline styles skip the token set. Use a library component, its variants, or css() with tokens.',
  },
  {
    selector:
      "CallExpression[callee.property.name='addEventListener'][arguments.0.value=/^(error|unhandledrejection)$/]",
    message:
      'Only errors/globalHandlers.ts listens for error events. Let the error reach it, or call report() from errors/reporter.ts.',
  },
  {
    selector: 'AssignmentExpression[left.property.name=/^(onerror|onunhandledrejection)$/]',
    message:
      'Only errors/globalHandlers.ts listens for error events. Let the error reach it, or call report() from errors/reporter.ts.',
  },
]

// Zustand rules R3 and R4 (state/AGENTS.md).
const storeSyntax = [
  {
    selector: 'CallExpression[callee.name=/^use\\w*Store$/][arguments.length=0]',
    message:
      'Read a store through a selector, or better through its exported hook such as useShellSidebarOpen() (rule R3).',
  },
  {
    selector:
      'CallExpression[callee.name=/^use\\w*Store$/] > ArrowFunctionExpression > :matches(ObjectExpression, ArrayExpression)',
    message:
      'A selector that builds a new object or array re-renders forever in Zustand 5. Select each value with its own hook (rule R4).',
  },
]

// Rule R11: update a store with set(), never by changing what get() returns.
storeSyntax.push({
  selector:
    "AssignmentExpression[left.object.callee.name='get'], AssignmentExpression[left.object.object.callee.name='get']",
  message: 'Update a store only with set() (rule R11). Changing what get() returns skips the subscribers.',
})

// ---- Layers (eslint-plugin-boundaries) ----
const isPageLayer = (layer) => pageLayers.includes(layer)
const samePage = { page: '{{ from.element.captured.page }}' }

const elements = Object.entries(layerPaths).map(([type, pattern]) => ({
  type,
  pattern,
  ...(pattern.includes('*') ? { capture: ['page'] } : {}),
}))

function targetSelector(from, to) {
  if (isPageLayer(from) && isPageLayer(to)) {
    // Inside a page; the page's own files below its root may reach only types.ts there.
    const onlyTypes = to === 'page' && from !== 'page'
    return { element: { type: to, captured: samePage, ...(onlyTypes ? { fileInternalPath: 'types.ts' } : {}) } }
  }
  if (to === 'page') return { element: { type: 'page', fileInternalPath: 'index.ts' } }
  return { element: { type: to } }
}

const layerPolicies = Object.entries(layers).map(([from, { mayImport }]) => ({
  from: { element: { type: from } },
  allow: { to: mayImport.map((to) => targetSelector(from, to)) },
}))

// A story of a page screen shows the page's states.
const storyPolicy = {
  from: { element: { type: 'pageScreens' }, file: { path: '**/*.stories.tsx' } },
  allow: { to: { element: { type: 'pageStates', captured: samePage } } },
}

const boundariesConfig = {
  files: ['web/src/**/*.{ts,tsx}'],
  plugins: { boundaries },
  settings: {
    'boundaries/legacy-templates': false,
    'boundaries/elements': elements,
  },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [...layerPolicies, storyPolicy],
        message:
          '{{ from.element.type }} may not import this {{ to.element.type }} file. Imports go down the layers in web/src/structure.ts; another page is never imported, and a page from outside is entered through its index.ts. Move shared code to blocks/ or lib/, or pass it as a prop.',
      },
    ],
  },
}

// ---- Packages and globals per layer ----
const propsOnlyMessage =
  'Screens, blocks and states are props-only (d-081): no store, router, data client, error boundary library or storage. Read it in the page entry (InboxPage.tsx) and pass a prop; wrap rich content in BlockBoundary from errors/.'
const zustandMessage = `Only ${storeLayer}/ imports zustand. Make a store with createAppStore from state/createAppStore.ts.`
const boundaryMessage = `Only ${errorLayer}/ imports react-error-boundary. Use AppBoundary, PaneSlot or BlockBoundary from errors/.`
const paneMessage = 'Render a pane through PaneSlot from errors/PaneSlot.tsx, which gives it a PaneBoundary.'

// A layer's files, without the files of a layer nested in it (pages/*/screens in pages/*).
const filesOf = (layer) => {
  const base = layerPaths[layer]
  const nested = Object.values(layerPaths).filter((p) => p !== base && p.startsWith(`${base}/`))
  return { files: [`${base}/**/*.{ts,tsx}`], ignores: nested.map((p) => `${p}/**`) }
}

// Zustand rules R1, R2, R5, R6 and R7 (state/AGENTS.md).
const rawStoreMessage =
  "Use the store module's exported hooks (useShellSidebarOpen, useShellActions), not the raw store (rule R2). Tests may use the raw store."
const storeModule = {
  regex: '(^|\\/)\\w+Store(\\.ts)?$',
  importNamePattern: '^(use\\w+Store|(?!createApp)\\w+Store)$',
  message: rawStoreMessage,
}
const zustandInState = [
  { name: 'zustand/traditional', message: 'No equality-function API (rule R5). Select one value per hook instead.' },
  { name: 'zustand/middleware/immer', message: 'No immer middleware without a decision record (rule R6).' },
  {
    name: 'zustand/middleware',
    importNames: ['immer', 'combine', 'redux', 'subscribeWithSelector'],
    message: 'This middleware needs a decision record first (rule R6).',
  },
]
const createInState = {
  name: 'zustand',
  importNames: ['create', 'createStore'],
  message:
    'Make a store with createAppStore from state/createAppStore.ts, so it gets devtools and the reset registry (rule R7).',
}

function restrictedImports({ layer, test = false, allowPane = false, allowCreate = false }) {
  const patterns = []
  if (propsOnlyLayers.includes(layer))
    patterns.push({ regex: `^(${propsOnlyBans.join('|').replace(/\//g, '\\/')})(\\/|$)`, message: propsOnlyMessage })
  if (layer !== storeLayer) patterns.push({ regex: '^zustand(\\/|$)', message: zustandMessage })
  if (layer !== errorLayer && !allowPane) patterns.push({ regex: '^react-error-boundary$', message: boundaryMessage })
  if (!test) patterns.push(storeModule)
  const paths = allowPane
    ? []
    : [{ name: '@eshelton328/component-library-1701', importNames: ['Pane'], message: paneMessage }]
  if (layer === storeLayer) paths.push(...zustandInState, ...(allowCreate ? [] : [createInState]))
  return ['error', { patterns, paths }]
}

const layerImportConfigs = Object.keys(layerPaths).flatMap((layer) => {
  const { files, ignores } = filesOf(layer)
  const globalsRule = propsOnlyLayers.includes(layer)
    ? {
        'no-restricted-globals': [
          'error',
          ...propsOnlyGlobals.map((name) => ({
            name,
            message: `"${name}" reaches data or storage. ${propsOnlyMessage}`,
          })),
        ],
      }
    : {}
  return [
    { files, ignores, rules: { 'no-restricted-imports': restrictedImports({ layer }), ...globalsRule } },
    {
      files: files.map((f) => f.replace('*.{ts,tsx}', '*.test.{ts,tsx}')),
      ignores,
      rules: { 'no-restricted-imports': restrictedImports({ layer, test: true }) },
    },
  ]
})

// ---- File and folder names ----
// Folders and non-component files are camelCase; component files (.tsx)
// are PascalCase and named after their export. TanStack route files keep
// the router's names (__root.tsx, $id, URL segments).
const namingConfig = {
  files: [
    'web/src/**/*.{ts,tsx}',
    'shared/src/**/*.ts',
    'contract/src/**/*.ts',
    'server/src/**/*.ts',
    'scripts/**/*.ts',
  ],
  ignores: ['web/src/routes/**'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/filename-naming-convention': [
      'error',
      { '**/*.tsx': 'PASCAL_CASE', '**/*.ts': 'CAMEL_CASE' },
      { ignoreMiddleExtensions: true },
    ],
    'check-file/folder-naming-convention': [
      'error',
      { '{web/src,shared/src,contract/src,server/src,scripts}/**/': 'CAMEL_CASE' },
    ],
  },
}

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/dist-canvas/',
      '**/storybook-static/',
      '**/coverage/',
      '**/.tanstack/',
      'web/styled-system/',
      '**/*.gen.ts',
      'scripts/templates/',
      'eslint.config.js',
      'web/postcss.config.js',
    ],
  },
  {
    files: tsFiles,
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      comments.recommended,
    ],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: { ...typeRules, 'no-restricted-syntax': ['error', ...typeSyntax] },
  },
  { files: nodeFiles, languageOptions: { globals: globals.node } },
  { files: ['shared/src/**/*.ts', 'contract/src/**/*.ts'], languageOptions: { globals: {} } },
  {
    files: webFiles,
    extends: [eslintReact.configs['recommended-type-checked'], reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-syntax': ['error', ...webSyntax, ...storeSyntax],
      'no-console': 'error',
    },
  },
  await panda.configs.recommended({
    cwd: `${import.meta.dirname}/web`,
    configPath: `${import.meta.dirname}/web/panda.config.ts`,
    files: webFiles,
  }),
  {
    files: webFiles,
    // Panda resolves the config's include globs from web/, not the repository root.
    settings: { panda: { cwd: `${import.meta.dirname}/web` } },
    rules: {
      '@pandacss/prefer-token': 'error',
      '@pandacss/no-primitive-token': 'error',
      '@pandacss/no-dynamic-styling': 'error',
      '@pandacss/no-deprecated': 'error',
      '@pandacss/no-important': 'error',
      '@pandacss/no-debug': 'error',
      '@pandacss/extraction-diagnostics': 'error',
    },
  },
  ...storybook.configs['flat/recommended'],
  { files: ['web/src/routes/**/*.{ts,tsx}'], extends: router.configs['flat/recommended'] },
  boundariesConfig,
  ...layerImportConfigs,
  // The exceptions: the reporter logs, and PaneSlot renders the library's Pane.
  { files: ['web/src/errors/reporter.ts'], rules: { 'no-console': 'off' } },
  {
    files: [paneSlotFile],
    rules: { 'no-restricted-imports': restrictedImports({ layer: errorLayer, allowPane: true }) },
  },
  {
    files: ['web/src/state/createAppStore.ts'],
    rules: { 'no-restricted-imports': restrictedImports({ layer: storeLayer, allowCreate: true }) },
  },
  {
    files: ['web/src/errors/globalHandlers.ts'],
    rules: { 'no-restricted-syntax': ['error', ...typeSyntax, ...storeSyntax] },
  },
  // Module augmentation needs an interface: the router registers its type on TanStack's Register, and the
  // E2E setup its provided values on Vitest's ProvidedContext.
  {
    files: ['web/src/app/router.ts', 'e2e/herdrSession.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  namingConfig,
)
