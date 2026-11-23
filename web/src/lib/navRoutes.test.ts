import { describe, expect, it } from 'vitest'
import { navRoute } from './navRoutes.ts'

describe('navRoute', () => {
  it('opens each page with a route, Settings included (d-119)', () => {
    expect(['inbox', 'workspaces', 'artifacts', 'toolkit', 'settings'].map(navRoute)).toEqual([
      '/inbox',
      '/workspaces',
      '/artifacts',
      '/toolkit',
      '/settings',
    ])
  })

  it('gives no route for a page without one, or for More', () => {
    expect(['home', 'projects', 'more', 'brain'].map(navRoute)).toEqual([undefined, undefined, undefined, undefined])
  })
})
