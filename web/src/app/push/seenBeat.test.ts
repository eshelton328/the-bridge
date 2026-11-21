import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seenEveryMs, startSeenBeat } from './seenBeat.ts'

// The "seen" beat (d-118): one send when the page shows, one every 20 s while it shows, none while it is hidden.

/** A document whose visibility the test sets. */
function fakeDoc(visible: boolean) {
  const target = new EventTarget()
  const first: DocumentVisibilityState = visible ? 'visible' : 'hidden'
  const doc = {
    visibilityState: first,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    show(next: boolean) {
      doc.visibilityState = next ? 'visible' : 'hidden'
      target.dispatchEvent(new Event('visibilitychange'))
    },
  }
  return doc
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the seen beat', () => {
  it('sends at once on a shown page, then every 20 s', () => {
    const send = vi.fn()
    const stop = startSeenBeat({ send, doc: fakeDoc(true) })
    expect(send).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(seenEveryMs - 1)
    expect(send).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(send).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(seenEveryMs * 3)
    expect(send).toHaveBeenCalledTimes(5)
    stop()
  })

  it('sends nothing while the page is hidden, and starts again when it shows', () => {
    const send = vi.fn()
    const doc = fakeDoc(false)
    const stop = startSeenBeat({ send, doc })
    vi.advanceTimersByTime(seenEveryMs * 5)
    expect(send).not.toHaveBeenCalled()
    doc.show(true)
    expect(send).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(seenEveryMs)
    expect(send).toHaveBeenCalledTimes(2)
    doc.show(false)
    vi.advanceTimersByTime(seenEveryMs * 5)
    expect(send).toHaveBeenCalledTimes(2)
    stop()
  })

  it('keeps one timer: a second visible event does not send again or add a timer', () => {
    const send = vi.fn()
    const doc = fakeDoc(true)
    const stop = startSeenBeat({ send, doc })
    doc.show(true)
    doc.show(true)
    expect(send).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(seenEveryMs)
    expect(send).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(1)
    stop()
  })

  it('stops for good: no timer and no listener after the stop', () => {
    const send = vi.fn()
    const doc = fakeDoc(true)
    const stop = startSeenBeat({ send, doc })
    stop()
    expect(vi.getTimerCount()).toBe(0)
    doc.show(false)
    doc.show(true)
    vi.advanceTimersByTime(seenEveryMs * 3)
    expect(send).toHaveBeenCalledTimes(1)
  })
})
