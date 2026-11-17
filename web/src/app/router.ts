// The router, with the default error and not-found fallbacks that every
// route uses (d-084: no second boundary per route).
import { createRouter } from '@tanstack/react-router'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { routeTree } from './routeTree.gen.ts'

export const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
