import { describe, expect, it, onTestFinished } from 'vitest'
import { createRing, type KeyboardTraceSample, readSample, startKeyboardTrace } from './keyboardTrace.ts'

// `?keyboard-trace` (dev only): one sample per event and animation frame,
// kept in a ring buffer and POSTed to the dev server. It reads tag names and
// roles of focused elements, never their text, value, name or id.

const FIELDS = ['t', 'type', 'innerHeight', 'vvHeight', 'vvOffsetTop', 'vvPageTop', 'scrollY', 'keyboard']

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
})
