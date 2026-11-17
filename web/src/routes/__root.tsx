// The root route. It renders the matched page; the router defaults in
// app/router.ts give every route its error and not-found fallbacks.
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute()
