// The text size before and after the first paint (d-122): index.html's
// inline script and applyTextSize give the same classes for each saved
// value, and a bad or missing value, or blocked storage, keeps Default
// with no throw.
import { textSizeClass } from '@eshelton328/component-library-1701'
import { afterEach, describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { settingsKey, textSizes } from '../lib/deviceSettings.ts'
import { applyTextSize } from './textSize.ts'

const page = new DOMParser().parseFromString(indexHtml, 'text/html')
const script = page.getElementById('text-size')?.textContent ?? ''

const frames: HTMLIFrameElement[] = []
afterEach(() => {
  for (const frame of frames.splice(0)) frame.remove()
})

/** The class list of `root` with only the text size classes, sorted. */
function sizeClasses(root: Element): string[] {
  const names: string[] = Object.values(textSizeClass).filter((c) => c !== null)
  return [...root.classList].filter((c) => names.includes(c)).sort()
}

/** Runs the inline script in a new frame whose <html> has index.html's class, with this storage. */
function runScript(stored: { text: string | null } | 'blocked') {
  const frame = document.createElement('iframe')
  frames.push(frame)
  document.body.append(frame)
  const win = frame.contentWindow
  const doc = frame.contentDocument
  if (win === null || doc === null) throw new Error('no frame document')
  doc.documentElement.className = page.documentElement.className
  const keys: string[] = []
  const storage = {
    getItem: (key: string) => {
      keys.push(key)
      if (stored === 'blocked') throw new DOMException('blocked', 'SecurityError')
      return stored.text
    },
  }
  Object.defineProperty(win, 'localStorage', { configurable: true, get: () => storage })
  const el = doc.createElement('script')
  el.textContent = `${script}\ndocument.documentElement.dataset.finished = 'yes'`
  doc.head.append(el)
  return { classes: sizeClasses(doc.documentElement), keys, finished: doc.documentElement.dataset.finished === 'yes' }
}

/** The classes applyTextSize leaves on an element that starts as index.html's <html>. */
function applied(size: (typeof textSizes)[number]): string[] {
  const root = document.createElement('html')
  root.className = page.documentElement.className
  applyTextSize(size, root)
  return sizeClasses(root)
}

describe('the inline text size script', () => {
  it('is in index.html, whose <html> starts Default and Dark', () => {
    expect(script).toContain(settingsKey)
    expect(page.documentElement.classList.contains('dark')).toBe(true)
    expect(sizeClasses(page.documentElement)).toEqual(['text-default'])
  })

  it('applies Small, Default and Large as applyTextSize does, reading only the settings key', () => {
    for (const textSize of textSizes) {
      const run = runScript({ text: JSON.stringify({ mode: 'light', textSize }) })
      expect(run.classes, textSize).toEqual(applied(textSize))
      expect(run.keys, textSize).toEqual([settingsKey])
      expect(run.finished, textSize).toBe(true)
    }
    // Small, the designs' size, has no class; Large has only its own.
    expect(applied('small')).toEqual([])
    expect(applied('default')).toEqual(['text-default'])
    expect(applied('large')).toEqual(['text-large'])
  })

  it('keeps Default for a missing, bad or unknown value and for blocked storage, with no throw', () => {
    for (const stored of [
      { text: null },
      { text: '{' },
      { text: '"text"' },
      { text: JSON.stringify({ textSize: 'huge' }) },
      'blocked',
    ] as const) {
      const run = runScript(stored)
      const label = JSON.stringify(stored)
      expect(run.classes, label).toEqual(['text-default'])
      expect(run.finished, label).toBe(true)
    }
  })
})

describe('applyTextSize', () => {
  it('moves from one size to another and leaves the other classes', () => {
    const root = document.createElement('html')
    root.className = 'dark text-default'
    applyTextSize('large', root)
    expect([...root.classList].sort()).toEqual(['dark', 'text-large'])
    applyTextSize('small', root)
    expect([...root.classList]).toEqual(['dark'])
    applyTextSize('default', root)
    expect([...root.classList].sort()).toEqual(['dark', 'text-default'])
  })
})
