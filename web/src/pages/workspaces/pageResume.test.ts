// The page's trips to the background (pageResume.ts): which connection's miss
// counts as the close iOS makes of a page in the background.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  followPageVisibility,
  fromBackground,
  hidesSoFar,
  resumeGraceMs,
  resumeMark,
  whenVisible,
} from './pageResume.ts'

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') })
  if (hidden) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
  document.dispatchEvent(new Event('visibilitychange'))
  if (!hidden) window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
}

followPageVisibility()

afterEach(() => {
  setHidden(false)
  Reflect.deleteProperty(document, 'visibilityState')
  vi.useRealTimers()
})

describe('pageResume', () => {
  it('counts one trip for the visibilitychange and pagehide of one hide', () => {
    const before = hidesSoFar()
    setHidden(true)
    expect(hidesSoFar()).toBe(before + 1)
    setHidden(false)
    expect(hidesSoFar()).toBe(before + 1)
  })

  it('takes a miss of a connection that was open while the page hid as from the background', () => {
    vi.useFakeTimers({ toFake: ['performance'] })
    vi.advanceTimersByTime(resumeGraceMs * 2)
    const mark = resumeMark()
    expect(mark.resuming).toBe(false)
    expect(fromBackground(mark)).toBe(false)
    setHidden(true)
    expect(fromBackground(mark)).toBe(true)
    setHidden(false)
    // Shown again: the connection still went through the trip.
    expect(fromBackground(mark)).toBe(true)
  })

  it('takes a connection that starts within the grace after the page shows as part of the return, and none after', () => {
    vi.useFakeTimers({ toFake: ['performance'] })
    setHidden(true)
    setHidden(false)
    vi.advanceTimersByTime(resumeGraceMs - 100)
    expect(fromBackground(resumeMark())).toBe(true)
    vi.advanceTimersByTime(200)
    expect(fromBackground(resumeMark())).toBe(false)
  })

  it('resolves whenVisible when the page shows, or at once when it shows already', async () => {
    const signal = new AbortController().signal
    await whenVisible(signal)
    setHidden(true)
    let shown = false
    const waiting = whenVisible(signal).then(() => {
      shown = true
    })
    await Promise.resolve()
    expect(shown).toBe(false)
    setHidden(false)
    await waiting
    expect(shown).toBe(true)
  })
})
