import { describe, expect, it, onTestFinished } from 'vitest'
import { blockPageZoom, isIos, type NavigatorLike, shouldBlockGesture } from './pageZoom.ts'

// Erik's decision (2026-11-18): no page zoom on any platform. index.html's
// viewport meta turns it off where browsers honour it; on iOS, which ignores
// user-scalable=no, blockPageZoom cancels the pinch gestures, except inside
// an element marked data-allow-pinch.
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const IPAD_SAFARI =
  'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const iphone: NavigatorLike = { userAgent: IPHONE_SAFARI, platform: 'iPhone', maxTouchPoints: 5 }
const ipad: NavigatorLike = { userAgent: IPAD_SAFARI, platform: 'iPad', maxTouchPoints: 5 }
const ipadosAsMac: NavigatorLike = { userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 5 }
const mac: NavigatorLike = { userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 }
const android: NavigatorLike = { userAgent: ANDROID_CHROME, platform: 'Linux armv8l', maxTouchPoints: 5 }
const desktop: NavigatorLike = { userAgent: DESKTOP_CHROME, platform: 'Win32', maxTouchPoints: 0 }

describe('isIos', () => {
  it('is true for an iPhone, an iPad and iPadOS that reports a Mac with touch', () => {
    expect(isIos(iphone)).toBe(true)
    expect(isIos(ipad)).toBe(true)
    expect(isIos(ipadosAsMac)).toBe(true)
  })

  it('is false for a Mac without touch, Android Chrome and desktop Chrome', () => {
    expect(isIos(mac)).toBe(false)
    expect(isIos(android)).toBe(false)
    expect(isIos(desktop)).toBe(false)
  })
})

/** Adds an element to the page for one test. */
function mount(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  onTestFinished(() => {
    host.remove()
  })
  return host
}

/** Dispatches a cancelable gesture event, as iOS Safari sends for a pinch, and says whether it was cancelled. */
function pinch(target: Element, type: 'gesturestart' | 'gesturechange'): boolean {
  const event = new Event(type, { bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event.defaultPrevented
}

describe('blockPageZoom', () => {
  it('cancels a pinch outside data-allow-pinch on iOS and lets one inside through', () => {
    onTestFinished(blockPageZoom(iphone, document))
    const host = mount('<p id="text">Inbox</p><div data-allow-pinch><span id="map">map</span></div>')
    const text = host.querySelector('#text')
    const map = host.querySelector('#map')
    if (text === null || map === null) throw new Error('no elements')
    expect(pinch(text, 'gesturestart')).toBe(true)
    expect(pinch(text, 'gesturechange')).toBe(true)
    expect(pinch(map, 'gesturestart')).toBe(false)
    expect(pinch(map, 'gesturechange')).toBe(false)
  })

  it('adds no listener off iOS, where the viewport meta does the work', () => {
    onTestFinished(blockPageZoom(android, document))
    const text = mount('<p>Inbox</p>').firstElementChild
    if (text === null) throw new Error('no element')
    expect(pinch(text, 'gesturestart')).toBe(false)
  })

  it('stops cancelling once removed', () => {
    const remove = blockPageZoom(iphone, document)
    remove()
    const text = mount('<p>Inbox</p>').firstElementChild
    if (text === null) throw new Error('no element')
    expect(pinch(text, 'gesturestart')).toBe(false)
  })
})

describe('shouldBlockGesture', () => {
  it('blocks a target outside data-allow-pinch and a target that is no element', () => {
    const host = mount('<p>Inbox</p><div data-allow-pinch><span>map</span></div>')
    expect(shouldBlockGesture(host.querySelector('p'))).toBe(true)
    expect(shouldBlockGesture(host.querySelector('span'))).toBe(false)
    expect(shouldBlockGesture(document)).toBe(true)
    expect(shouldBlockGesture(null)).toBe(true)
  })
})
