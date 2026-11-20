import { notFound, redirect } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FixtureError } from './appError.ts'
import { addSink, clearReports, getReports, repeatWindowMs, report, subscribeReports } from './reporter.ts'

afterEach(() => {
  clearReports()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** A new Error object each call, thrown from the same place, as a timer that fails on each tick throws one. */
const tick = (message: string) => new Error(message)

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

  it('keeps an equal error thrown fresh on each tick once within the repeat window (audit W-5)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.useFakeTimers()
    report(new Error('first'), 'handler')
    for (let i = 0; i < 60; i += 1) report(tick('every tick'), 'handler')
    expect(getReports().map((r) => r.error.message)).toEqual(['first', 'every tick'])
    vi.advanceTimersByTime(repeatWindowMs)
    report(tick('every tick'), 'handler')
    expect(getReports().map((r) => r.error.message)).toEqual(['first', 'every tick', 'every tick'])
  })

  it('keeps errors that differ in source, name, message or first stack frame', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    report(tick('same'), 'handler')
    report(tick('same'), 'window')
    report(tick('other'), 'handler')
    report(new TypeError('same'), 'handler')
    report(new Error('same'), 'handler')
    expect(getReports()).toHaveLength(5)
  })

  it('gives each report its own sequence number, also two equal messages in one millisecond', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.useFakeTimers()
    report(new Error('same'), 'handler')
    report(new Error('same'), 'window')
    const seqs = getReports().map((r) => r.seq)
    expect(new Set(seqs).size).toBe(2)
    expect(getReports().map((r) => r.at)).toEqual([getReports()[0]?.at, getReports()[0]?.at])
  })

  it('skips a redirect, a notFound and an AbortError', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    report(redirect({ to: '/inbox' }), 'rejection')
    report(notFound(), 'root-caught')
    report(new DOMException('The user aborted a request.', 'AbortError'), 'rejection')
    expect(getReports()).toEqual([])
  })

  it('drops a wrapper whose cause was reported, as a caller that adds context to a failed query throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failed = new Error('the server answered 502')
    report(failed, 'query')
    report(new Error('Live data failed; showing mock data', { cause: failed }), 'handler')
    expect(getReports().map((r) => [r.source, r.error])).toEqual([['query', failed]])
  })

  it('keeps an error whose message holds an @ from two places, since the header is not a frame', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fromHere = () => new Error('no answer from owner@host')
    const fromThere = () => new Error('no answer from owner@host')
    report(fromHere(), 'handler')
    report(fromThere(), 'handler')
    expect(getReports()).toHaveLength(2)
  })

  it('logs a sink that throws once and still gives the report to the other sinks and the buffer (2b-6)', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failure = new Error('sink down')
    const removeBroken = addSink(() => {
      throw failure
    })
    const next = vi.fn()
    const removeNext = addSink(next)
    const error = new Error('first')
    report(error, 'handler')
    removeBroken()
    removeNext()
    const sinkLogs = log.mock.calls.filter(([message]) => message === '[bridge] error sink failed')
    expect(sinkLogs).toEqual([['[bridge] error sink failed', failure]])
    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0]?.[0]).toMatchObject({ error, source: 'handler' })
    expect(getReports().map((r) => r.error)).toEqual([error])
  })
})
