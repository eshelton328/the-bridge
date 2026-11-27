import { describe, expect, it } from 'vitest'
import { navRoute } from './navRoutes.ts'

describe('navRoute', () => {
  it('opens each page with a route, Projects (f-008 R1) and Settings (d-119) included', () => {
    expect(['inbox', 'workspaces', 'projects', 'artifacts', 'toolkit', 'settings'].map(navRoute)).toEqual([
      '/inbox',
      '/workspaces',
      '/projects',
      '/artifacts',
      '/toolkit',
      '/settings',
    ])
  })

  it('gives no route for a page without one, or for More', () => {
    expect(['home', 'more', 'brain'].map(navRoute)).toEqual([undefined, undefined, undefined])
  })
})
