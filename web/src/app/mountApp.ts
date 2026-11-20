// Mounts the app in a container: the window handlers and React's root error
// hooks feed the reporter, AppBoundary catches what nothing else does, and
// the dev ErrorTray beside it lists the reports. main.ts calls it on #root; a test
// calls it with a memory-history router and unmounts it after.
import { type AnyRouter, RouterProvider } from '@tanstack/react-router'
import { createElement, Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppBoundary } from '../errors/AppBoundary.tsx'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { type ErrorEventTarget, installGlobalHandlers } from '../errors/globalHandlers.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { router } from './router.ts'

/** What a test swaps: the router, and where the window error listeners go. */
export type MountOptions = { router?: AnyRouter; events?: ErrorEventTarget }

/** Renders the app in `container` with its error wiring (audit W-9); returns the unmount, which also removes the handlers. */
export function mountApp(container: Element, options: MountOptions = {}): () => void {
  const appRouter = options.router ?? router
  const removeHandlers = installGlobalHandlers(options.events)
  const root = createRoot(container, rootErrorOptions)
  root.render(
    createElement(
      StrictMode,
      null,
      // The tray is AppBoundary's sibling, so it still lists a crash that replaces the whole app (audit W-11).
      createElement(
        Fragment,
        null,
        createElement(AppBoundary, null, createElement(RouterProvider, { router: appRouter })),
        createElement(ErrorTray),
      ),
    ),
  )
  return () => {
    root.unmount()
    removeHandlers()
  }
}
