// Setup for each web browser test file (vitest.config.ts). It wraps page.viewport() with the guard in
// viewportGuard.ts, so an afterEach that resizes before it unmounts the test's views fails the test. It wraps fetch
// with the guard in serverGuard.ts, so a test that reads the real server with no stub fails.
import { afterEach, beforeEach } from 'vitest'
import { page } from 'vitest/browser'
import { serverReadError } from './serverGuard.ts'
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

// A test's vi.stubGlobal('fetch') replaces this wrapper, and vi.unstubAllGlobals() puts it back.
const serverReads: string[] = []
const realFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const error = serverReadError(url, window.location.origin)
  if (error === undefined) return realFetch(input, init)
  serverReads.push(error.message)
  return Promise.reject(error)
}

afterEach(() => {
  const reads = serverReads.splice(0)
  if (reads.length > 0) throw new Error(reads.join('\n'))
})
