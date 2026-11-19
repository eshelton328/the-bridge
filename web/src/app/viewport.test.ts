import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'

// The viewport meta of index.html. Page zoom is off on every platform
// (the owner, 2026-11-18): iOS zooms the page when a field under 16 px takes the
// focus, and the Figma font sizes stay. `interactive-widget` keeps the
// layout resized for the on-screen keyboard on Chrome for Android.
// `viewport-fit=cover` lets iOS draw the app under the status bar and the
// home indicator and gives env(safe-area-inset-*) their real size, which
// the library's AppShell pads by (bridge-shell's decision, brain 681246a).
const head = new DOMParser().parseFromString(indexHtml, 'text/html')

describe('the viewport meta', () => {
  it('turns page zoom off, keeps the keyboard resize and covers the safe areas', () => {
    expect(head.querySelector('meta[name="viewport"]')?.getAttribute('content')).toBe(
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content, viewport-fit=cover',
    )
  })
})
