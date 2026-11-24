import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '../lib/queryClient.ts'
import { OpaqueScriptError } from './appError.ts'
import { installGlobalHandlers } from './globalHandlers.ts'
import { clearReports, getReports } from './reporter.ts'

afterEach(() => {
  clearReports()
  vi.restoreAllMocks()
})

// A stand-in for the window, so the test's events never reach Vitest's own
// window error listener.
const target = new EventTarget()

describe('installGlobalHandlers', () => {
  it('reports window errors and unhandled rejections until removed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = installGlobalHandlers(target)
    const error = new Error('from a timer')
    target.dispatchEvent(new ErrorEvent('error', { error, message: error.message }))
    const reason = new Error('from a promise')
    target.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason }))
    remove()
    target.dispatchEvent(new ErrorEvent('error', { error: new Error('after removal') }))
    expect(getReports().map((r) => [r.source, r.error])).toEqual([
      ['window', error],
      ['rejection', reason],
    ])
  })

  it('listens on the window by default', () => {
    const remove = installGlobalHandlers()
    remove()
    expect(getReports()).toEqual([])
  })

  it('reports the message when the event has no error object but names its script', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = installGlobalHandlers(target)
    target.dispatchEvent(
      new ErrorEvent('error', { message: 'Out of memory', filename: 'http://127.0.0.1/src/main.ts', lineno: 3 }),
    )
    remove()
    expect(getReports()[0]?.error.message).toBe('Out of memory')
  })

  it('reports a masked error of a script from another origin as an OpaqueScriptError, and a normal one as before', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = installGlobalHandlers(target)
    target.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }))
    const error = new Error('from a timer')
    target.dispatchEvent(
      new ErrorEvent('error', { error, message: error.message, filename: 'http://127.0.0.1/a.ts', lineno: 9 }),
    )
    remove()
    const [opaque, normal] = getReports()
    expect(opaque?.error).toBeInstanceOf(OpaqueScriptError)
    expect(opaque?.error.message).toBe('')
    expect(Reflect.get(opaque?.error ?? {}, 'miss')).toMatch(/^(visible|hidden), \d+ ms since load$/)
    expect(normal?.error).toBe(error)
  })

  it('keeps the text of an event with no error object, no file and line 0 that is not masked', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = installGlobalHandlers(target)
    target.dispatchEvent(
      new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.' }),
    )
    remove()
    const [report] = getReports()
    expect(report?.error).not.toBeInstanceOf(OpaqueScriptError)
    expect(report?.error.message).toBe('ResizeObserver loop completed with undelivered notifications.')
  })

  it('reports a query that fails for good until removed (audit W-7)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = installGlobalHandlers(target)
    const client = createQueryClient()
    const failed = Object.assign(new Error('Not found'), { status: 404 })
    await client.query({ queryKey: ['reported'], queryFn: () => Promise.reject(failed) }).catch(() => undefined)
    remove()
    await client
      .query({ queryKey: ['after'], queryFn: () => Promise.reject(new Error('after removal')), retry: false })
      .catch(() => undefined)
    expect(getReports().map((r) => [r.source, r.error])).toEqual([['query', failed]])
  })
})
