import { afterEach, describe, expect, it, vi } from 'vitest'
import { FixtureError } from './appError.ts'
import { clearReports, getReports, report, subscribeReports } from './reporter.ts'

afterEach(() => {
  clearReports()
  vi.restoreAllMocks()
})

describe('report', () => {
  it('keeps a report with its source, stack and route', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const error = new Error('boom')
    report(error, 'root-caught', 'at Inbox')
    const [entry] = getReports()
    expect(entry?.error).toBe(error)
    expect(entry?.source).toBe('root-caught')
    expect(entry?.componentStack).toBe('at Inbox')
    expect(entry?.route).toBe(window.location.pathname)
  })

  it('reports the same error object once', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const error = new Error('twice')
    report(error, 'root-caught')
    report(error, 'window')
    expect(getReports()).toHaveLength(1)
  })

  it('turns a thrown value that is not an Error into one, keeping the cause', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    report('a string', 'handler')
    expect(getReports()[0]?.error.message).toBe('a string')
    report(42, 'handler')
    expect(getReports()[1]?.error.cause).toBe(42)
  })

  it('keeps the last 50 reports', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    for (let i = 0; i < 60; i += 1) report(new Error(String(i)), 'handler')
    expect(getReports()).toHaveLength(50)
    expect(getReports()[0]?.error.message).toBe('10')
  })

  it('logs to the console in development and tells subscribers', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const listener = vi.fn()
    const unsubscribe = subscribeReports(listener)
    report(new FixtureError('inbox/nextStep', 'title: required'), 'root-caught')
    unsubscribe()
    report(new Error('after'), 'handler')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalled()
  })
})
