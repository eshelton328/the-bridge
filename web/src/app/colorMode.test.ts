// The colour mode before and after the first paint (d-119): index.html's
// inline script and followColorMode give the same class for each saved
// value, and a bad or missing value, or blocked storage, keeps Dark with
// no throw.
import { afterEach, describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { settingsKey } from '../lib/deviceSettings.ts'
import { canvasVariable, followColorMode, isDark } from './colorMode.ts'

const page = new DOMParser().parseFromString(indexHtml, 'text/html')
const script = page.getElementById('color-mode')?.textContent ?? ''
const themeMeta = page.querySelector('meta[name="theme-color"]')
const themeDark = themeMeta?.getAttribute('data-dark')
const themeLight = themeMeta?.getAttribute('data-light')

const frames: HTMLIFrameElement[] = []
afterEach(() => {
  for (const frame of frames.splice(0)) frame.remove()
})

/**
 * Runs the inline script in a new frame whose <html> has index.html's class, with this storage (one that throws when
 * `stored` is `blocked`) and device scheme. `finished` is false when the script threw: a line after it did not run.
 */
function runScript(stored: { text: string | null } | 'blocked', deviceDark: boolean) {
  const frame = document.createElement('iframe')
  frames.push(frame)
  document.body.append(frame)
  const win = frame.contentWindow
  const doc = frame.contentDocument
  if (win === null || doc === null) throw new Error('no frame document')
  doc.documentElement.className = page.documentElement.className
  const theme = page.querySelector('meta[name="theme-color"]')
  if (theme !== null) doc.head.append(doc.importNode(theme))
  const keys: string[] = []
  const storage = {
    getItem: (key: string) => {
      keys.push(key)
      if (stored === 'blocked') throw new DOMException('blocked', 'SecurityError')
      return stored.text
    },
  }
  Object.defineProperty(win, 'localStorage', { configurable: true, get: () => storage })
  Object.defineProperty(win, 'matchMedia', { configurable: true, value: () => ({ matches: deviceDark }) })
  const el = doc.createElement('script')
  el.textContent = `${script}\ndocument.documentElement.dataset.finished = 'yes'`
  doc.head.append(el)
  return {
    dark: doc.documentElement.classList.contains('dark'),
    themeColor: doc.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    keys,
    finished: doc.documentElement.dataset.finished === 'yes',
  }
}

describe('the inline colour mode script', () => {
  it('is in index.html, whose <html> starts Dark, with the Dark theme-color', () => {
    expect(script).toContain(settingsKey)
    expect(page.documentElement.classList.contains('dark')).toBe(true)
    expect(themeMeta?.getAttribute('content')).toBe(themeDark)
    expect(themeLight).not.toBe(themeDark)
    // "default" lets the iOS Home Screen app's status bar follow theme-color; "black" keeps it black after a change.
    expect(page.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content')).toBe(
      'default',
    )
  })

  it('applies Light, Dark and System as followColorMode does, reading only the settings key', () => {
    for (const mode of ['light', 'dark', 'system'] as const)
      for (const deviceDark of [true, false]) {
        const run = runScript({ text: JSON.stringify({ mode, nav: 'other fields stay unread' }) }, deviceDark)
        const label = `${mode}, device dark ${String(deviceDark)}`
        expect(run.dark, label).toBe(isDark(mode, deviceDark))
        expect(run.themeColor, label).toBe(isDark(mode, deviceDark) ? themeDark : themeLight)
        expect(run.keys).toEqual([settingsKey])
        expect(run.finished).toBe(true)
      }
  })

  it('keeps Dark with no throw for a missing or bad value or blocked storage', () => {
    const values = [null, '', '{', 'null', '"light"', '{"mode":"sepia"}', '{"mode":null}'].map((text) => ({ text }))
    for (const stored of [...values, 'blocked' as const]) {
      const run = runScript(stored, false)
      expect(run.dark, JSON.stringify(stored)).toBe(true)
      expect(run.themeColor, JSON.stringify(stored)).toBe(themeDark)
      expect(run.finished, JSON.stringify(stored)).toBe(true)
    }
  })
})

describe('followColorMode', () => {
  it('sets the class and the theme-color for the mode and follows the device while the mode is System', () => {
    const doc = document.implementation.createHTMLDocument()
    const root = doc.documentElement
    root.classList.add('dark')
    const theme = doc.createElement('meta')
    theme.name = 'theme-color'
    doc.head.append(theme)
    // A stand-in for Panda's bg.canvas variable, which the dark class changes.
    const canvasOf = () => (root.classList.contains('dark') ? '#000001' : '#fffffe')
    const metas = () => doc.querySelectorAll('meta[name="theme-color"]')
    const color = () => metas()[0]?.getAttribute('content')
    const listeners = new Set<() => void>()
    const query = {
      matches: true,
      addEventListener: (_: 'change', l: () => void) => listeners.add(l),
      removeEventListener: (_: 'change', l: () => void) => listeners.delete(l),
    }
    const mode = followColorMode({
      matchMedia: () => query,
      document: doc,
      getComputedStyle: () => ({ getPropertyValue: (name) => (name === canvasVariable ? ` ${canvasOf()}` : '') }),
    })
    mode.apply('light')
    expect(root.classList.contains('dark')).toBe(false)
    expect(color()).toBe('#fffffe')
    // A new element in the old one's place: the iOS Home Screen app's bar follows only that.
    expect(metas()).toHaveLength(1)
    expect(metas()[0]).not.toBe(theme)
    const lightMeta = metas()[0]
    mode.apply('light')
    expect(metas()[0], 'no new element when the colour stays').toBe(lightMeta)
    mode.apply('system')
    expect(root.classList.contains('dark')).toBe(true)
    expect(color()).toBe('#000001')
    query.matches = false
    for (const l of listeners) l()
    expect(root.classList.contains('dark')).toBe(false)
    expect(color()).toBe('#fffffe')
    mode.apply('dark')
    expect(root.classList.contains('dark')).toBe(true)
    expect(color()).toBe('#000001')
    mode.stop()
    expect(listeners.size).toBe(0)
  })
})
