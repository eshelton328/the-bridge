// Setup for each web browser test file (vitest.config.ts). It wraps page.viewport() with the guard in
// viewportGuard.ts, so an afterEach that resizes before it unmounts the test's views fails the test.
import { beforeEach } from 'vitest'
import { page } from 'vitest/browser'
import { mountedViews } from './testRender.ts'
import { viewportChangeError } from './viewportGuard.ts'

let testState: () => string | undefined = () => undefined

beforeEach((context) => {
  testState = () => context.task.result?.state
})

const viewport = page.viewport.bind(page)
Object.defineProperty(page, 'viewport', {
  configurable: true,
  value: async (width: number, height: number) => {
    const error = viewportChangeError(testState(), mountedViews())
    if (error !== undefined) throw error
    await viewport(width, height)
  },
})
