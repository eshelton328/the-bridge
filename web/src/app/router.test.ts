import { describe, expect, it } from 'vitest'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { router } from './router.ts'

// Every route gets its error and not-found fallbacks from these defaults,
// so no route needs a boundary of its own (d-084).
describe('router', () => {
  it('sets the default error and not-found components', () => {
    expect(router.options.defaultErrorComponent).toBe(RouteError)
    expect(router.options.defaultNotFoundComponent).toBe(NotFound)
  })
})
