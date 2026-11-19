import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'

// The viewport meta of index.html. Page zoom is off on every platform
// (the owner, 2026-11-18): iOS zooms the page when a field under 16 px takes the
// focus, and the Figma font sizes stay. `interactive-widget` keeps the
// layout resized for the on-screen keyboard on Chrome for Android.
const head = new DOMParser().parseFromString(indexHtml, 'text/html')

describe('the viewport meta', () => {
  it('turns page zoom off and keeps the keyboard resize', () => {
    expect(head.querySelector('meta[name="viewport"]')?.getAttribute('content')).toBe(
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content',
    )
  })
})
