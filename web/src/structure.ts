// The layers of web/src in one place. The root eslint.config.js reads this
// file for the layer import rules and the package bans, and
// scripts/checkStructure.ts and scripts/new.ts read it too. Decisions in
// the brain: d-081 (layers; organised by page as Erik changed it on
// 2026-11-16), d-083 (stores), d-084 (errors).

/**
 * Layers: the folders under `web/src/` and, inside each page folder, its
 * `screens/`, `blocks/` and `states/`. A file may import only the layers
 * in its `mayImport` list. A page layer may import only its own page; a
 * `page` import from outside the page goes through the page's `index.ts`.
 */
export const layers = {
  app: { mayImport: ['app', 'routes', 'state', 'errors', 'lib'] },
  routes: { mayImport: ['page'] },
  page: { mayImport: ['page', 'pageScreens', 'pageBlocks', 'pageStates', 'blocks', 'state', 'errors', 'lib'] },
  pageScreens: { mayImport: ['pageScreens', 'pageBlocks', 'page', 'blocks', 'errors', 'lib'] },
  pageBlocks: { mayImport: ['pageBlocks', 'page', 'blocks', 'errors', 'lib'] },
  pageStates: { mayImport: ['pageStates', 'page', 'lib'] },
  blocks: { mayImport: ['blocks', 'errors', 'lib'] },
  state: { mayImport: ['state', 'lib'] },
  errors: { mayImport: ['errors', 'lib'] },
  lib: { mayImport: ['lib'] },
  design: { mayImport: ['design', 'page', 'blocks', 'errors', 'lib'] },
} as const satisfies Record<string, { mayImport: readonly string[] }>

export type Layer = keyof typeof layers

/** Where each layer lives, relative to the repository root. `*` is one page folder. */
export const layerPaths = {
  app: 'web/src/app',
  routes: 'web/src/routes',
  pageScreens: 'web/src/pages/*/screens',
  pageBlocks: 'web/src/pages/*/blocks',
  pageStates: 'web/src/pages/*/states',
  page: 'web/src/pages/*',
  blocks: 'web/src/blocks',
  state: 'web/src/state',
  errors: 'web/src/errors',
  lib: 'web/src/lib',
  design: 'web/src/design',
} as const satisfies Record<Layer, string>

/** Layers that hold one folder per page; their imports stay inside the page. */
export const pageLayers = ['page', 'pageScreens', 'pageBlocks', 'pageStates'] as const satisfies readonly Layer[]

/** The pages of the app, in nav order. Only the pages listed here may have a folder. */
export const pages = ['home', 'inbox', 'workspaces', 'projects', 'artifacts', 'toolkit'] as const

/** Layers that take data as props and report through callbacks: no stores, router, fetch or storage. */
export const propsOnlyLayers = ['pageScreens', 'pageBlocks', 'pageStates', 'blocks'] as const satisfies readonly Layer[]

/** Packages that hold application state, routing, data or error boundaries; props-only layers never import them. */
export const propsOnlyBans = [
  'zustand',
  '@tanstack/react-router',
  '@tanstack/react-query',
  'hono',
  'react-error-boundary',
] as const

/** Browser globals that reach data or storage; props-only layers never use them. */
export const propsOnlyGlobals = [
  'fetch',
  'localStorage',
  'sessionStorage',
  'WebSocket',
  'EventSource',
  'XMLHttpRequest',
] as const

/** The only layer that imports zustand (d-083). Pages make their stores with its createAppStore. */
export const storeLayer = 'state' satisfies Layer

/** The only layer that imports react-error-boundary and reports errors (d-084). */
export const errorLayer = 'errors' satisfies Layer

/** The only file that renders the library's Pane, so every pane has a PaneBoundary. */
export const paneSlotFile = 'web/src/errors/PaneSlot.tsx'
