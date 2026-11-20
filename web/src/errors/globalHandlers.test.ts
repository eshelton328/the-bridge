import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '../lib/queryClient.ts'
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

  it('reports the message when the event has no error object', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = installGlobalHandlers(target)
    target.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }))
    remove()
    expect(getReports()[0]?.error.message).toBe('Script error.')
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
