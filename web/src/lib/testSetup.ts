// Setup for each web browser test file (vitest.config.ts). It wraps page.viewport() with the guard in
// viewportGuard.ts, so an afterEach that resizes before it unmounts the test's views fails the test. It wraps fetch
// with the guard in serverGuard.ts, so a test that reads the real server with no stub fails, and XMLHttpRequest's
// open too, so a chunk upload (W1b) with no stub fails the same way, before it sends a byte. Before a file's tests it
// loads every font face the file's CSS declares (loadFonts.ts), so no test measures text in a fallback font.
import { afterEach, beforeAll, beforeEach } from 'vitest'
import { page } from 'vitest/browser'
import { loadDeclaredFonts } from './loadFonts.ts'
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

// A test's vi.stubGlobal('XMLHttpRequest') replaces the class, so its requests never reach this open.
const xhrOpen: unknown = Reflect.get(XMLHttpRequest.prototype, 'open')
Object.defineProperty(XMLHttpRequest.prototype, 'open', {
  configurable: true,
  writable: true,
  value: function open(this: XMLHttpRequest, method: string, url: string | URL) {
    const error = serverReadError(String(url), window.location.origin)
    if (error !== undefined) {
      serverReads.push(error.message)
      throw error
    }
    if (typeof xhrOpen === 'function') Reflect.apply(xhrOpen, this, [method, url])
  },
})

afterEach(() => {
  const reads = serverReads.splice(0)
  if (reads.length > 0) throw new Error(reads.join('\n'))
})

// The test file's imports (its CSS and fonts) have run by now; its tests have not.
beforeAll(async () => {
  await loadDeclaredFonts()
})
