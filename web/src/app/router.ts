// The router, with the default error and not-found fallbacks that every
// route uses (d-084: no second boundary per route), and the loading
// standard's timing: a route's pendingComponent (the shell with its page's
// skeleton) shows only after 200 ms with no data, and then for at least
// 300 ms, so a quick load shows no skeleton and a slow one never blinks.
import { createRouter } from '@tanstack/react-router'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { pendingTiming } from '../lib/pendingTiming.ts'
import { routeTree } from './routeTree.gen.ts'

/** When a route's pendingComponent shows, and for how long at least; the route tests use the same. */
export { pendingTiming }

export const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
  ...pendingTiming,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
