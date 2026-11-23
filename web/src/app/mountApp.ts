// Mounts the app in a container: the window handlers and React's root error
// hooks feed the reporter, AppBoundary catches what nothing else does, the
// live Inbox feed (InboxFeedProvider.tsx) gives every page the Inbox badge, and
// the dev ErrorTray beside it lists the reports. In the real app it also starts
// Web Push (push/startPush.ts, d-118): the service worker, its open-chat
// messages and the "seen" beat; never in a test, and never in Storybook, which
// does not mount the app. main.ts calls it on #root; a test calls it with a
// memory-history router and unmounts it after.
import { type AnyRouter, RouterProvider } from '@tanstack/react-router'
import { createElement, Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppBoundary } from '../errors/AppBoundary.tsx'
import { InboxFeedProvider } from './InboxFeedProvider.tsx'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { type ErrorEventTarget, installGlobalHandlers } from '../errors/globalHandlers.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { readsLiveServer } from '../lib/dataSource.ts'
import { readPushPreview } from '../state/settingsStore.ts'
import { pushRuns, startPush } from './push/startPush.ts'
import { router } from './router.ts'

/**
 * What a test swaps: the router, where the window error listeners go, whether Web Push starts (by default only in
 * the real app that reads the live server, in a secure context with a service worker; never in a test), and whether
 * the live Inbox feed runs (by default only in the real app that reads the live server; never in a test, which
 * renders `InboxFeedProvider` itself when it tests the feed).
 */
export type MountOptions = { router?: AnyRouter; events?: ErrorEventTarget; push?: boolean; liveInbox?: boolean }

const pushByDefault = () => import.meta.env.MODE !== 'test' && readsLiveServer() && pushRuns()
const liveInboxByDefault = () => import.meta.env.MODE !== 'test' && readsLiveServer()

/** Renders the app in `container` with its error wiring (audit W-9); returns the unmount, which also removes the handlers. */
export function mountApp(container: Element, options: MountOptions = {}): () => void {
  const appRouter = options.router ?? router
  const removeHandlers = installGlobalHandlers(options.events)
  const stopPush =
    (options.push ?? pushByDefault())
      ? startPush((chat) => {
          void appRouter.navigate({ to: '/workspaces', search: { chat } })
        }, readPushPreview)
      : undefined
  const routes = createElement(RouterProvider, { router: appRouter })
  const root = createRoot(container, rootErrorOptions)
  root.render(
    createElement(
      StrictMode,
      null,
      // The tray is AppBoundary's sibling, so it still lists a crash that replaces the whole app (audit W-11).
      createElement(
        Fragment,
        null,
        createElement(
          AppBoundary,
          null,
          (options.liveInbox ?? liveInboxByDefault()) ? createElement(InboxFeedProvider, null, routes) : routes,
        ),
        createElement(ErrorTray),
      ),
    ),
  )
  return () => {
    root.unmount()
    stopPush?.()
    removeHandlers()
  }
}
