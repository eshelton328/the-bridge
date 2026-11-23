import { describe, expect, it } from 'vitest'
import {
  tabletMorePage,
  checkNav,
  defaultSettings,
  defaultVisiblePages,
  moveNavPage,
  type NavEntry,
  navLayout,
  parseSettings,
  parseStoredSettings,
  setNavPageVisible,
} from './deviceSettings.ts'

const shown = (...pages: NavEntry['page'][]): NavEntry[] =>
  defaultSettings.nav.map((e) => ({ page: e.page, visible: pages.includes(e.page) }))

describe('parseStoredSettings', () => {
  it('gives the defaults, Dark, for no save, text that is not JSON or a value that is not an object', () => {
    for (const text of [null, '', '{', 'null', '"light"', '[]', '42'])
      expect(parseStoredSettings(text)).toEqual(defaultSettings)
  })

  it('reads each field and keeps the default of each field it cannot read', () => {
    const settings = parseStoredSettings(
      JSON.stringify({ mode: 'light', textSize: 'huge', chat: { model: 'haiku', effort: 'max', permission: 'plan' } }),
    )
    expect(settings.mode).toBe('light')
    expect(settings.textSize).toBe('default')
    expect(settings.chat).toEqual({ model: 'haiku', effort: 'max', permission: 'plan' })
    expect(settings.nav).toEqual(defaultSettings.nav)
  })

  it('keeps the default nav for a stored nav that breaks the rules', () => {
    const navs: unknown[] = [
      [{ page: 'settings', visible: false }],
      [
        { page: 'inbox', visible: true },
        { page: 'inbox', visible: false },
      ],
      shown('home'),
      shown(),
      [{ page: 'inbox' }],
      'inbox',
    ]
    for (const nav of navs) expect(parseSettings({ nav }).nav).toEqual(defaultSettings.nav)
  })

  it('keeps a stored order and adds a page it lacks at the end, shown', () => {
    const nav = parseSettings({
      nav: [
        { page: 'toolkit', visible: true },
        { page: 'inbox', visible: false },
      ],
    }).nav
    expect(nav.map((e) => e.page)).toEqual(['toolkit', 'inbox', 'home', 'workspaces', 'projects', 'artifacts'])
    expect(nav.filter((e) => !e.visible).map((e) => e.page)).toEqual(['inbox'])
  })
})

describe('the nav rules', () => {
  it('never hides the page on screen', () => {
    expect(setNavPageVisible(defaultSettings.nav, 'inbox', false, 'inbox')).toEqual({ ok: false, error: 'currentPage' })
    expect(setNavPageVisible(defaultSettings.nav, 'inbox', false, 'toolkit').ok).toBe(true)
  })

  it('never leaves fewer than one shown tab item besides Home', () => {
    expect(setNavPageVisible(shown('home', 'toolkit'), 'toolkit', false, undefined)).toEqual({
      ok: false,
      error: 'noVisiblePage',
    })
    expect(setNavPageVisible(shown('home', 'toolkit'), 'inbox', true, undefined).ok).toBe(true)
    expect(checkNav(shown('toolkit')).ok).toBe(true)
  })

  it('has no Settings page to hide: Settings stays reachable from More', () => {
    const pages: readonly string[] = defaultSettings.nav.map((e) => e.page)
    expect(pages).not.toContain('settings')
    expect(parseSettings({ nav: [...defaultSettings.nav, { page: 'settings', visible: false }] }).nav).toEqual(
      defaultSettings.nav,
    )
  })

  it('moves a page one place and leaves the ends as they are', () => {
    const pages = (nav: readonly NavEntry[]) => nav.map((e) => e.page)
    expect(pages(moveNavPage(defaultSettings.nav, 'toolkit', -1))).toEqual([
      'home',
      'inbox',
      'workspaces',
      'projects',
      'toolkit',
      'artifacts',
    ])
    expect(moveNavPage(defaultSettings.nav, 'home', -1)).toBe(defaultSettings.nav)
    expect(moveNavPage(defaultSettings.nav, 'toolkit', 1)).toBe(defaultSettings.nav)
  })
})

describe('navLayout', () => {
  it('draws the default order as the Figma frames do', () => {
    expect(navLayout(defaultVisiblePages, 'desktop').rail).toEqual([
      'inbox',
      'workspaces',
      'projects',
      'artifacts',
      'toolkit',
    ])
    expect(navLayout(defaultVisiblePages, 'tablet')).toMatchObject({
      tabs: ['home', 'inbox', 'workspaces', 'projects', 'artifacts'],
      more: ['toolkit'],
    })
    expect(navLayout(defaultVisiblePages, 'phone')).toMatchObject({
      tabs: ['home', 'inbox', 'workspaces', 'projects'],
      more: ['artifacts', 'toolkit'],
    })
  })

  it('follows the owner order and leaves hidden pages out', () => {
    const layout = navLayout(['toolkit', 'home', 'inbox', 'artifacts', 'projects'], 'phone')
    expect(layout).toEqual({
      rail: ['toolkit', 'inbox', 'artifacts', 'projects'],
      tabs: ['toolkit', 'home', 'inbox', 'artifacts'],
      more: ['projects'],
    })
  })
})

describe('tabletMorePage', () => {
  it('opens the first shown page past the tablet tabs, or More when none is left', () => {
    expect(tabletMorePage(['toolkit'])).toBe('toolkit')
    expect(tabletMorePage(['artifacts', 'toolkit'])).toBe('artifacts')
    expect(tabletMorePage([])).toBe('more')
  })
})
