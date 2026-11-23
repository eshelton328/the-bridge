import { describe, expect, it, onTestFinished } from 'vitest'
import { DUMP_STYLES, type HeaderTrace, readHeaderDump, startHeaderTrace } from './headerTrace.ts'
import type { RouteSource } from './keyboardChatTrace.ts'

// The chat header dump (dev only, screen review R57): the layer-making and text-drawing styles, scroll offsets, boxes
// and animations of the chat title and each ancestor, never the title or any other text of the page.

const SECRET = 'secret chat title'

/** A chat header as PhoneChat draws it: the title h2 in ChatHead's header, in the AppShell detail's ScrollFrame. */
function mountChat() {
  const host = document.createElement('div')
  host.className = 'app-shell__root app-shell__root--size_tablet css-abc'
  host.setAttribute('aria-label', 'secret label')
  host.innerHTML =
    '<main class="app-shell__detail"><div class="scroll-frame__root"><div class="scroll-frame__header" id="secret-id">' +
    '<header data-figma="105:785"><div class="titles" style="padding-top:4.5px">' +
    `<h2 style="margin:0;font-size:17px;font-weight:600">${SECRET}</h2></div></header></div></div></main>`
  document.body.append(host)
  onTestFinished(() => {
    host.remove()
  })
  const title = host.querySelector('h2')
  const frame = host.querySelector<HTMLElement>('.scroll-frame__root')
  if (title === null || frame === null) throw new Error('no title')
  return { host, title, frame }
}

/** A route source whose path the test sets, calling the subscriber on each change. */
function routeAt(pathname: string) {
  const current = { pathname, search: '?state=phoneChatFull&q=secret' }
  let changed: () => void = () => undefined
  const route: RouteSource = {
    current: () => current,
    subscribe: (onChange) => {
      changed = onChange
      return () => undefined
    },
  }
  return {
    route,
    go: (next: string) => {
      current.pathname = next
      changed()
    },
  }
}

/** Whether a POST body is a header trace: its `trace` and `samples` (the rest the test reads field by field). */
const isTrace = (value: unknown): value is HeaderTrace =>
  typeof value === 'object' &&
  value !== null &&
  Reflect.get(value, 'trace') === 'header' &&
  Array.isArray(Reflect.get(value, 'samples'))

/** Starts a dump that posts into `posts` every 40 ms, and stops it after the test. */
function record(route: RouteSource) {
  const posts: string[] = []
  const running = startHeaderTrace({
    route,
    everyMs: 40,
    scrollEveryMs: 10,
    post: (_endpoint, body) => {
      posts.push(body)
      return Promise.resolve(undefined)
    },
  })
  onTestFinished(running.stop)
  const last = (): HeaderTrace | undefined => {
    const body = posts.at(-1)
    if (body === undefined) return undefined
    const trace: unknown = JSON.parse(body)
    return isTrace(trace) ? trace : undefined
  }
  return { posts, last, stop: running.stop }
}

describe('chat header dump', () => {
  it('reads the title and each ancestor up to html, with every style, its scroll, box and animations', () => {
    const { title, frame } = mountChat()
    frame.style.transform = 'translateY(0.5px)'
    frame.style.willChange = 'transform'
    const moving = frame.animate([{ opacity: 1 }, { opacity: 0.5 }], { duration: 10_000 })
    onTestFinished(() => {
      moving.cancel()
    })
    const dump = readHeaderDump(title, 'tick')
    expect(dump.type).toBe('tick')
    expect(Date.parse(dump.at)).toBeGreaterThan(0)
    expect(dump.t).toBeGreaterThan(0)
    expect(dump.devicePixelRatio).toBe(window.devicePixelRatio)
    expect(typeof dump.visualViewport?.scale).toBe('number')
    expect(typeof dump.visualViewport?.height).toBe('number')
    // The chain runs from the title to html.
    expect(dump.chain[0]?.el).toBe('h2')
    expect(dump.chain.at(-1)?.el).toBe('html')
    expect(dump.chain.map((element) => element.el)).toEqual(
      expect.arrayContaining([
        'header[105:785]',
        'div.scroll-frame__header',
        'div.scroll-frame__root',
        'main.app-shell__detail',
        'div.app-shell__root',
        'body',
      ]),
    )
    for (const element of dump.chain) {
      expect(Object.keys(element.style)).toEqual([...DUMP_STYLES])
      expect(typeof element.scrollTop).toBe('number')
      expect(typeof element.scrollLeft).toBe('number')
      expect(element.animationCount).toBe(element.animations.length)
    }
    const root = dump.chain.find((element) => element.el === 'div.scroll-frame__root')
    expect(root?.style.transform).toBe('matrix(1, 0, 0, 1, 0, 0.5)')
    expect(root?.style['will-change']).toBe('transform')
    expect(root?.animations).toEqual([
      {
        kind: 'Animation',
        playState: 'running',
        target: 'div.scroll-frame__root',
        keyframes: 2,
        properties: ['opacity'],
        startTime: moving.startTime,
        currentTime: root?.animations[0]?.currentTime,
      },
    ])
    expect(root?.animations[0]?.currentTime).toBeGreaterThanOrEqual(0)
    expect(dump.chain[0]?.style['font-weight']).toBe('600')
    // The title's box keeps its fractions, and its offset inside the header.
    expect(dump.title.inHeader.y).toBe(4.5)
    expect(dump.title.rect.y - dump.title.inHeader.y).toBeCloseTo(
      title.closest('header')?.getBoundingClientRect().y ?? 0,
    )
    expect(dump.title.textLength).toBe(SECRET.length)
  })

  it('records no text of the page: no title, id, label or class other than component parts', () => {
    const { title } = mountChat()
    const text = JSON.stringify(readHeaderDump(title, 'tick'))
    expect(text).not.toContain('secret')
    expect(text).not.toContain('css-abc')
    expect(text).not.toContain('titles')
  })

  it('dumps on /workspaces while a chat is open, one session per open, and posts it with no text', async () => {
    const { host } = mountChat()
    const { route } = routeAt('/workspaces')
    const { posts, last } = record(route)
    await expect.poll(() => last()?.samples.length ?? 0).toBeGreaterThan(2)
    const trace = last()
    expect(trace).toMatchObject({ trace: 'header', route: { pathname: '/workspaces', state: 'phoneChatFull' } })
    expect(Date.parse(trace?.startedAt ?? '')).toBeGreaterThan(0)
    expect(trace?.samples[0]?.type).toBe('open')
    expect(trace?.samples[1]?.type).toBe('tick')
    for (const body of posts) expect(body).not.toContain('secret')
    // A scroll and a focus change each take a dump, after the event.
    window.dispatchEvent(new Event('scroll'))
    await expect.poll(() => last()?.samples.some((dump) => dump.type === 'scroll')).toBe(true)
    window.dispatchEvent(new FocusEvent('focusin'))
    await expect.poll(() => last()?.samples.some((dump) => dump.type === 'focusin')).toBe(true)
    // Closing the chat ends the session; the next open starts another.
    const first = trace?.startedAt
    host.remove()
    await new Promise((done) => setTimeout(done, 100))
    const count = posts.length
    await new Promise((done) => setTimeout(done, 100))
    expect(posts.length).toBe(count)
    await new Promise((done) => setTimeout(done, 5))
    mountChat()
    await expect.poll(() => last()?.startedAt !== first && last()?.samples[0]?.type === 'open').toBe(true)
  })

  it('takes no dump and posts nothing off /workspaces, or with no chat open', async () => {
    mountChat()
    const away = routeAt('/inbox')
    const { posts } = record(away.route)
    await new Promise((done) => setTimeout(done, 150))
    expect(posts).toEqual([])
    away.go('/workspaces')
    await expect.poll(() => posts.length).toBeGreaterThan(0)
    away.go('/inbox')
    const count = posts.length
    await new Promise((done) => setTimeout(done, 150))
    expect(posts.length).toBe(count)
  })

  it('posts nothing on /workspaces with no chat open', async () => {
    const { posts } = record(routeAt('/workspaces').route)
    await new Promise((done) => setTimeout(done, 150))
    expect(posts).toEqual([])
  })

  it('keeps one POST out at a time and sends only the newest snapshot after a slow one', async () => {
    mountChat()
    const bodies: string[] = []
    const answers: (() => void)[] = []
    const running = startHeaderTrace({
      route: routeAt('/workspaces').route,
      everyMs: 20,
      post: (_endpoint, body) => {
        bodies.push(body)
        return new Promise<void>((done) => {
          answers.push(done)
        })
      },
    })
    onTestFinished(running.stop)
    await expect.poll(() => bodies.length).toBe(1)
    // Many ticks pass while the first POST is out: none of them posts.
    await new Promise((done) => setTimeout(done, 200))
    expect(bodies.length).toBe(1)
    answers.shift()?.()
    await expect.poll(() => bodies.length).toBe(2)
    const samples = (body: string | undefined) => {
      const trace: unknown = JSON.parse(body ?? '')
      return isTrace(trace) ? trace.samples.length : 0
    }
    // The second POST is the newest snapshot, with every tick since the first.
    expect(samples(bodies[1])).toBeGreaterThan(samples(bodies[0]) + 5)
    await new Promise((done) => setTimeout(done, 100))
    expect(bodies.length).toBe(2)
  })
})
