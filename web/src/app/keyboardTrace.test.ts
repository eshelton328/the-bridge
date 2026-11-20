import { describe, expect, it, onTestFinished, vi } from 'vitest'
import {
  createRing,
  type KeyboardTraceSample,
  readDisplayMode,
  readHeader,
  readKbExperiment,
  readSafeArea,
  readSample,
  startKeyboardTrace,
} from './keyboardTrace.ts'

// `?keyboard-trace` (dev only): one sample per event and animation frame,
// kept in a ring buffer and POSTed to the dev server. It reads tag names and
// roles of focused elements, never their text, value, name or id.

const FIELDS = [
  't',
  'type',
  'innerHeight',
  'vvHeight',
  'vvOffsetTop',
  'vvPageTop',
  'scrollY',
  'scrollTop',
  'rootTop',
  'composerTop',
  'keyboard',
]

function mountShell(): HTMLElement {
  const host = document.createElement('div')
  host.className = 'app-shell__root'
  host.style.setProperty('--app-shell-keyboard', '336px')
  host.innerHTML =
    '<input id="secret-id" name="secret-name" role="combobox" value="secret value" aria-label="secret label">'
  document.body.append(host)
  onTestFinished(() => {
    host.remove()
  })
  return host
}

/** Starts a trace that posts into `posts`, and stops it after the test. */
function trace(cap = 20000) {
  const posts: string[] = []
  const running = startKeyboardTrace({
    cap,
    postEveryMs: 50,
    post: (_endpoint, body) => {
      posts.push(body)
      return Promise.resolve(undefined)
    },
  })
  onTestFinished(running.stop)
  return { ...running, posts }
}

const ofType = (samples: KeyboardTraceSample[], type: string) => samples.filter((s) => s.type === type)

describe('keyboard trace sampler', () => {
  it('reads the document scroll, the app root top and the composer top, so a page that iOS moves shows (R27)', () => {
    const own = document.getElementById('root')
    const root = own ?? document.createElement('div')
    if (own === null) {
      root.id = 'root'
      document.body.append(root)
    }
    const style = root.getAttribute('style')
    root.style.cssText = 'position:fixed;left:0;right:0;height:100px;top:-403px'
    const footer = document.createElement('div')
    footer.className = 'scroll-frame__footer'
    footer.innerHTML =
      '<div data-keyboard-keep="" style="position:fixed;top:331px;height:40px"><textarea></textarea></div>'
    document.body.append(footer)
    onTestFinished(() => {
      footer.remove()
      if (own === null) root.remove()
      else if (style === null) root.removeAttribute('style')
      else root.setAttribute('style', style)
    })
    const moved = readSample('raf', null)
    expect(moved).toMatchObject({ rootTop: -403, composerTop: 331, scrollTop: 0 })
    root.style.top = '0px'
    expect(readSample('raf', null).rootTop).toBe(0)
    footer.remove()
    expect(readSample('raf', null).composerTop).toBeNull()
  })

  it('records one sample for each event type, with the viewport fields and the shell keyboard inset', async () => {
    const input = mountShell().querySelector('input')
    if (input === null) throw new Error('no input')
    const running = trace()
    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    input.focus()
    input.blur()
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('scroll'))
    window.visualViewport?.dispatchEvent(new Event('resize'))
    window.visualViewport?.dispatchEvent(new Event('scroll'))
    await expect.poll(() => ofType(running.trace().samples, 'raf').length).toBeGreaterThan(0)
    const samples = running.trace().samples
    for (const type of [
      'pointerdown',
      'pointerup',
      'focusin',
      'focusout',
      'resize',
      'scroll',
      'vv-resize',
      'vv-scroll',
      'raf',
    ]) {
      const sample = ofType(samples, type).at(0)
      expect(sample, type).toBeDefined()
      for (const field of FIELDS) expect(sample, `${type}.${field}`).toHaveProperty(field)
      expect(sample?.keyboard).toBe('336px')
      expect(sample?.vvHeight).toBe(window.visualViewport?.height)
      expect(sample?.innerHeight).toBe(window.innerHeight)
    }
    for (const type of ['pointerdown', 'pointerup', 'resize', 'raf'])
      expect(ofType(samples, type).at(0)).not.toHaveProperty('targetTag')
    expect(ofType(samples, 'focusin').at(0)).toMatchObject({ targetTag: 'input', targetRole: 'combobox' })
  })

  it('records no text, value, name, id or label of a focused field', async () => {
    const input = mountShell().querySelector('input')
    if (input === null) throw new Error('no input')
    const running = trace()
    input.focus()
    input.value = 'typed secret'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.blur()
    await expect.poll(() => running.posts.length).toBeGreaterThan(0)
    const sent = [JSON.stringify(running.trace()), ...running.posts].join('\n')
    expect(sent).toContain('"targetTag":"input"')
    expect(sent).not.toMatch(/secret/)
  })

  it('keeps only the last samples once the ring buffer is full', () => {
    const ring = createRing<number>(3)
    for (const n of [1, 2, 3, 4, 5]) ring.push(n)
    expect(ring.size).toBe(3)
    expect(ring.toArray()).toEqual([3, 4, 5])
    const running = trace(5)
    for (let i = 0; i < 20; i++) window.dispatchEvent(new Event('resize'))
    expect(running.trace().samples).toHaveLength(5)
  })

  it('posts the whole trace as { startedAt, userAgent, samples }', async () => {
    const running = trace()
    await expect.poll(() => running.posts.length).toBeGreaterThan(0)
    const body: unknown = JSON.parse(running.posts[0] ?? '')
    expect(body).toMatchObject({ startedAt: running.trace().startedAt, userAgent: navigator.userAgent })
    expect(body).toHaveProperty('samples')
    expect(Number.isNaN(Date.parse(running.trace().startedAt))).toBe(false)
  })

  it('sends its last snapshot when the page is hidden, even while a POST is still out', async () => {
    const posts: string[] = []
    const running = startKeyboardTrace({
      postEveryMs: 60_000,
      overlay: false,
      // A POST that never settles, as on a slow network when the page goes away.
      post: (_endpoint, body) => {
        posts.push(body)
        return new Promise(() => undefined)
      },
    })
    onTestFinished(running.stop)
    const hidden = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    onTestFinished(() => {
      Reflect.deleteProperty(document, 'visibilityState')
      expect(Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')).toEqual(hidden)
    })
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('resize'))
    document.dispatchEvent(new Event('visibilitychange'))
    await expect.poll(() => posts.length).toBe(2)
    expect(posts[1]).toContain('"type":"resize"')
    expect(posts[0]).not.toContain('"type":"resize"')
  })

  it('sends its last snapshot when the page is hidden before the safe-area probe had its frames', async () => {
    // A hidden page runs no animation frame.
    const frames = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0)
    onTestFinished(() => {
      frames.mockRestore()
    })
    const posts: string[] = []
    const running = startKeyboardTrace({
      postEveryMs: 60_000,
      overlay: false,
      post: (_endpoint, body) => {
        posts.push(body)
        return Promise.resolve(undefined)
      },
    })
    onTestFinished(running.stop)
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    onTestFinished(() => {
      Reflect.deleteProperty(document, 'visibilityState')
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await expect.poll(() => posts.length, { timeout: 2000 }).toBe(1)
    expect(document.querySelector('[data-keyboard-trace-probe]')).toBeNull()
  })

  it('shows an overlay that takes no tap and no focus, and removes it on stop', () => {
    const running = trace()
    const overlay = document.querySelector<HTMLElement>('[data-keyboard-trace]')
    if (overlay === null) throw new Error('no overlay')
    const style = getComputedStyle(overlay)
    expect(style.position).toBe('fixed')
    expect(style.pointerEvents).toBe('none')
    expect(overlay.inert).toBe(true)
    expect(overlay.getAttribute('aria-hidden')).toBe('true')
    running.stop()
    expect(document.querySelector('[data-keyboard-trace]')).toBeNull()
  })

  it('reads a sample with an empty keyboard when no shell is on the page', () => {
    expect(readSample('raf', null).keyboard).toBe('')
  })

  it('records the display mode, the screen, the pixel ratio and the safe area in the header', async () => {
    const running = trace()
    await expect.poll(() => running.posts.length).toBeGreaterThan(0)
    const body: unknown = JSON.parse(running.posts[0] ?? '')
    expect(body).toMatchObject({
      displayMode: 'browser',
      screenHeight: screen.height,
      screenWidth: screen.width,
      devicePixelRatio: window.devicePixelRatio,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    // The safe-area probe is gone once it is read.
    expect(document.querySelector('[data-keyboard-trace-probe]')).toBeNull()
  })

  it('reads the safe area from the probe after two frames of layout, then removes the probe', async () => {
    // A layout's insets, as an iPhone 390 × 844 gives them with viewport-fit=cover.
    const insets = document.createElement('div').style
    insets.padding = '47px 0px 34px 0px'
    let frames = 0
    const raf = window.requestAnimationFrame.bind(window)
    const frameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) =>
      raf((time) => {
        frames += 1
        callback(time)
      }),
    )
    const reads: { frames: number; connected: boolean; padding: string }[] = []
    const real = window.getComputedStyle.bind(window)
    const styleSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      if (!(el instanceof HTMLElement) || !el.hasAttribute('data-keyboard-trace-probe')) return real(el, pseudo)
      reads.push({ frames, connected: el.isConnected, padding: el.style.padding })
      return insets
    })
    onTestFinished(() => {
      frameSpy.mockRestore()
      styleSpy.mockRestore()
    })
    const pending = readSafeArea()
    const probe = document.querySelector<HTMLElement>('[data-keyboard-trace-probe]')
    if (probe === null) throw new Error('no probe')
    const style = real(probe)
    expect(style.position).toBe('fixed')
    expect(style.visibility).toBe('hidden')
    expect(await pending).toEqual({ top: 47, right: 0, bottom: 34, left: 0 })
    expect(reads).toHaveLength(1)
    expect(reads[0]?.frames).toBeGreaterThanOrEqual(2)
    expect(reads[0]?.connected).toBe(true)
    expect(reads[0]?.padding).toBe(
      'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
    )
    expect(document.querySelector('[data-keyboard-trace-probe]')).toBeNull()
  })

  it('reads standalone from the display-mode query or from navigator.standalone, else browser', async () => {
    const real = window.matchMedia.bind(window)
    // A real list that matches, or one that does not, for the standalone query.
    const standaloneQuery = (matches: boolean) => {
      const spy = vi
        .spyOn(window, 'matchMedia')
        .mockImplementation((query) =>
          query === '(display-mode: standalone)'
            ? real(matches ? '(min-width: 0px)' : '(max-width: -1px)')
            : real(query),
        )
      onTestFinished(() => {
        spy.mockRestore()
      })
    }
    const iosStandalone = (value: boolean) => {
      Object.defineProperty(navigator, 'standalone', { configurable: true, value })
      onTestFinished(() => {
        Reflect.deleteProperty(navigator, 'standalone')
      })
    }
    standaloneQuery(false)
    expect(readDisplayMode()).toBe('browser')
    expect((await readHeader()).displayMode).toBe('browser')
    iosStandalone(false)
    expect(readDisplayMode()).toBe('browser')
    iosStandalone(true)
    expect(readDisplayMode()).toBe('standalone')
    expect((await readHeader()).displayMode).toBe('standalone')
    Reflect.deleteProperty(navigator, 'standalone')
    standaloneQuery(true)
    expect(readDisplayMode()).toBe('standalone')
    expect(await readHeader(window, '2026-11-19T10:00:00.000Z')).toMatchObject({
      startedAt: '2026-11-19T10:00:00.000Z',
      userAgent: navigator.userAgent,
      displayMode: 'standalone',
    })
  })

  it('records reduced motion, the kb-experiment key and automation in the header, and no other search param', async () => {
    const before = window.location.href
    onTestFinished(() => {
      window.history.replaceState(null, '', before)
    })
    const real = window.matchMedia.bind(window)
    const reduce = (matches: boolean) => {
      const spy = vi
        .spyOn(window, 'matchMedia')
        .mockImplementation((query) =>
          query === '(prefers-reduced-motion: reduce)'
            ? real(matches ? '(min-width: 0px)' : '(max-width: -1px)')
            : real(query),
        )
      onTestFinished(() => {
        spy.mockRestore()
      })
    }
    const webdriver = (value: boolean) => {
      Object.defineProperty(navigator, 'webdriver', { configurable: true, value })
      onTestFinished(() => {
        Reflect.deleteProperty(navigator, 'webdriver')
      })
    }
    window.history.replaceState(null, '', `${window.location.pathname}?kb-experiment=dock_v2-a&q=typed%20text&state=x`)
    reduce(true)
    webdriver(true)
    const header = await readHeader(window, '2026-11-19T10:00:00.000Z')
    expect(header).toMatchObject({ reducedMotion: true, kbExperiment: 'dock_v2-a', automated: true })
    expect(Object.keys(header).sort()).toEqual(
      [
        'automated',
        'devicePixelRatio',
        'displayMode',
        'kbExperiment',
        'reducedMotion',
        'safeArea',
        'screenHeight',
        'screenWidth',
        'startedAt',
        'userAgent',
      ].sort(),
    )
    expect(JSON.stringify(header)).not.toContain('typed text')
    reduce(false)
    webdriver(false)
    window.history.replaceState(null, '', `${window.location.pathname}?q=1`)
    expect(await readHeader()).toMatchObject({ reducedMotion: false, kbExperiment: null, automated: false })
  })

  it('reads kb-experiment only as a short key of letters, digits, _ and -, else null', () => {
    const before = window.location.href
    onTestFinished(() => {
      window.history.replaceState(null, '', before)
    })
    const at = (search: string) => {
      window.history.replaceState(null, '', `${window.location.pathname}${search}`)
      return readKbExperiment()
    }
    expect(at('?kb-experiment=a')).toBe('a')
    expect(at(`?kb-experiment=${'x'.repeat(32)}`)).toBe('x'.repeat(32))
    expect(at('')).toBeNull()
    expect(at('?kb-experiment=')).toBeNull()
    expect(at(`?kb-experiment=${'x'.repeat(33)}`)).toBeNull()
    expect(at('?kb-experiment=my%20chat')).toBeNull()
    expect(at('?kb-experiment=a.b')).toBeNull()
    expect(at('?kb-experiment=%3Cscript%3E')).toBeNull()
  })
})
