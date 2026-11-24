// The chat header dump, a dev-only part of the keyboard trace for screen review R57 (a soft, doubled chat name on the
// owner's iPad). keyboardTraceSwitch.ts starts it beside the keyboard trace, with `?keyboard-trace` or the dev server's
// switch, and imports it dynamically, so a build leaves it out. It only reads.
//
// While a chat is open on `/workspaces` (its header's title, the h2 of ChatHead, is in the AppShell detail) it records
// one dump every 3 s and, at most one each 250 ms and never inside the event, after a scroll, a resize, a focus
// change, a rotation, a visibility change and a `pageshow`; the first dump after the page shows again is marked
// `back`. A dump has, for the title and each ancestor up to `html`, the computed styles that put an element on its own
// layer or change how its text draws, its scroll offsets, its box and its animations; for the title also its offset
// inside the header; and the page's scroll, the chat's scroll root, the orientation and `#root`'s top. One session per chat open, with its own `startedAt`, goes to the same
// endpoint as a keyboard trace (scripts/keyboardTracePlugin.ts) with `trace: 'header'`.
//
// A dump never holds text from the page: of the title only its length, and of each element its tag, its `data-figma`
// layer and its component class names (`part__slot`), never an id, a name, an aria label or a value.
import { readBuild, readDisplayMode, type TraceRoute } from './keyboardTrace.ts'
import { type RouteSource, traceRoute } from './keyboardChatTrace.ts'

/** The chat header's title: the h2 of a header with a Figma layer in the AppShell detail (ChatHead). */
export const CHAT_TITLE = '.app-shell__detail header[data-figma] h2'

/** The computed styles a dump reads for each element, by their CSS names. */
export const DUMP_STYLES = [
  'transform',
  'translate',
  'scale',
  'rotate',
  'will-change',
  'backdrop-filter',
  '-webkit-backdrop-filter',
  'filter',
  'opacity',
  'mask-image',
  '-webkit-mask-image',
  'clip-path',
  'overflow-x',
  'overflow-y',
  'position',
  'top',
  'contain',
  'isolation',
  'z-index',
  'font-family',
  'font-weight',
  'font-size',
  'line-height',
  'font-synthesis',
  'text-shadow',
  '-webkit-text-stroke-width',
  '-webkit-text-stroke-color',
  'background-clip',
  '-webkit-background-clip',
  'color',
  '-webkit-font-smoothing',
] as const

/** A box in CSS px, unrounded. */
type DumpRect = { x: number; y: number; width: number; height: number }

/** One animation on an element: no keyframe values, only what kind it is and where it runs. */
type DumpAnimation = {
  /** `CSSAnimation`, `CSSTransition` or `Animation` (Web Animations, such as AppShell's dock tracks). */
  kind: string
  playState: string
  /** The animated element as `DumpElement.el` names it; null with no target. */
  target: string | null
  keyframes: number
  /** The properties its keyframes set, such as `transform`. */
  properties: string[]
  startTime: number | null
  currentTime: number | null
}

/** One element of the chain: the title first, then each ancestor up to `html`. */
type DumpElement = {
  /** The tag, the `data-figma` layer and the component class names, such as `header[105:785]` or `div.app-shell__root`. */
  el: string
  rect: DumpRect
  scrollTop: number
  scrollLeft: number
  /** Each of `DUMP_STYLES` by name, as `getComputedStyle` gives it ('' where the browser has no such property). */
  style: Record<string, string>
  animationCount: number
  animations: DumpAnimation[]
}

/** One dump. */
export type HeaderDump = {
  /** `performance.now()`, in ms. */
  t: number
  /** The wall clock, ISO, to match a screenshot's time. */
  at: string
  /** What took it: `open`, `tick`, `scroll`, `resize`, `focusin`, `focusout`, `orientationchange`, `visibilitychange`, `pageshow`. */
  type: string
  devicePixelRatio: number
  innerWidth: number
  innerHeight: number
  visibility: string
  visualViewport: { offsetTop: number; pageTop: number; scale: number; width: number; height: number } | null
  title: {
    rect: DumpRect
    /** The title's box less its header's: its offset inside the header. */
    inHeader: { x: number; y: number }
    /** The number of characters of the title, never the title. */
    textLength: number
  }
  chain: DumpElement[]
  /** `window.scrollY`: 0 while `#root` is fixed, so anything else means the document scrolled. */
  scrollY: number
  /** The chat's scroll root, the ScrollFrame body beside the title's header: its scroll offset and sizes; null with none. */
  scrollRoot: { scrollTop: number; scrollHeight: number; clientHeight: number } | null
  /** `screen.orientation.type`, such as `portrait-primary`; null where the browser has none. */
  orientation: string | null
  /** `#root`'s top in the layout viewport: 0, or the R57 shift (headerShift.ts) while it is on. */
  rootTop: number | null
  /** Whether index.html's launch screen, `#launch`, is still on the page (launchEnd.ts removes it after the mount). */
  launch: boolean
  /**
   * Set on the first dump after the page comes back from the background (it was hidden, or a `pageshow` from the
   * back-forward cache): how long it was hidden, in ms (null when unknown), and the event that showed it. Else null.
   */
  back: { hiddenMs: number | null; via: string } | null
  /** The Geist faces the document has: family, weight and load status. */
  fonts: { family: string; weight: string; status: string }[]
}

/** A component class name, such as `scroll-frame__header`: no modifier, no utility class. */
const PART_CLASS = /^[a-z][a-z0-9-]*__[a-z][a-z0-9-]*$/
/** A Figma layer id, such as `105:785`. */
const FIGMA_LAYER = /^[0-9]+:[0-9]+$/

const rectOf = (element: Element): DumpRect => {
  const box = element.getBoundingClientRect()
  return { x: box.x, y: box.y, width: box.width, height: box.height }
}

/** The element's name in a dump: tag, Figma layer and component classes only. */
function elementName(element: Element): string {
  const figma = element.getAttribute('data-figma')
  const layer = figma !== null && FIGMA_LAYER.test(figma) ? `[${figma}]` : ''
  const parts = [...element.classList].filter((name) => PART_CLASS.test(name)).slice(0, 4)
  return `${element.tagName.toLowerCase()}${layer}${parts.map((name) => `.${name}`).join('')}`
}

function readAnimation(animation: Animation): DumpAnimation {
  const effect = animation.effect instanceof KeyframeEffect ? animation.effect : null
  const keyframes = effect === null ? [] : effect.getKeyframes()
  const skip = new Set(['offset', 'computedOffset', 'easing', 'composite'])
  const properties = [...new Set(keyframes.flatMap((frame) => Object.keys(frame).filter((key) => !skip.has(key))))]
  const time = (value: CSSNumberish | null) => (typeof value === 'number' ? value : null)
  return {
    kind: animation.constructor.name,
    playState: animation.playState,
    target: effect?.target ? elementName(effect.target) : null,
    keyframes: keyframes.length,
    properties,
    startTime: time(animation.startTime),
    currentTime: time(animation.currentTime),
  }
}

function readElement(element: Element, win: Window): DumpElement {
  const computed = win.getComputedStyle(element)
  const style: Record<string, string> = {}
  for (const name of DUMP_STYLES) style[name] = computed.getPropertyValue(name)
  const animations = element.getAnimations().map(readAnimation)
  return {
    el: elementName(element),
    rect: rectOf(element),
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
    style,
    animationCount: animations.length,
    animations,
  }
}

/** The open chat's title, or null when no chat is open. */
const chatTitle = (doc: Document): HTMLHeadingElement | null => doc.querySelector<HTMLHeadingElement>(CHAT_TITLE)

/** Reads one dump of `title` and its ancestors. */
export function readHeaderDump(title: Element, type: string, win: Window = window): HeaderDump {
  const chain: DumpElement[] = []
  for (let element: Element | null = title; element !== null; element = element.parentElement)
    chain.push(readElement(element, win))
  const rect = rectOf(title)
  const header = title.closest('header')
  const headerRect = header === null ? rect : rectOf(header)
  const vv = win.visualViewport
  const frame = title.closest('.scroll-frame__root')
  const body = frame === null ? null : frame.querySelector(':scope > .scroll-frame__body')
  const root = win.document.getElementById('root')
  return {
    t: win.performance.now(),
    at: new Date().toISOString(),
    type,
    devicePixelRatio: win.devicePixelRatio,
    innerWidth: win.innerWidth,
    innerHeight: win.innerHeight,
    visibility: win.document.visibilityState,
    visualViewport:
      vv === null
        ? null
        : { offsetTop: vv.offsetTop, pageTop: vv.pageTop, scale: vv.scale, width: vv.width, height: vv.height },
    title: {
      rect,
      inHeader: { x: rect.x - headerRect.x, y: rect.y - headerRect.y },
      textLength: title.textContent.length,
    },
    chain,
    scrollY: win.scrollY,
    scrollRoot:
      body === null
        ? null
        : { scrollTop: body.scrollTop, scrollHeight: body.scrollHeight, clientHeight: body.clientHeight },
    orientation: typeof win.screen.orientation === 'object' ? win.screen.orientation.type : null,
    rootTop: root === null ? null : root.getBoundingClientRect().y,
    launch: win.document.getElementById('launch') !== null,
    back: null,
    fonts: [...win.document.fonts]
      .filter((face) => face.family.replaceAll('"', '').startsWith('Geist'))
      .map((face) => ({ family: face.family.replaceAll('"', ''), weight: face.weight, status: face.status })),
  }
}

/** The trace a session POSTs: the keyboard trace's header fields it needs, `trace: 'header'` and the dumps. */
export type HeaderTrace = {
  trace: 'header'
  startedAt: string
  userAgent: string
  displayMode: 'standalone' | 'browser'
  screenHeight: number
  screenWidth: number
  devicePixelRatio: number
  automated: boolean
  build: ReturnType<typeof readBuild>
  route: TraceRoute
  /** The dumps, oldest first; the endpoint names `samples` and keeps the trace with the newest `t`. */
  samples: HeaderDump[]
}

export type HeaderTraceOptions = {
  win?: Window
  route: RouteSource
  endpoint?: string
  post?: (endpoint: string, body: string) => Promise<unknown>
  /** How often a dump is taken (and the session POSTed) while a chat is open, in ms. */
  everyMs?: number
  /** The least time between two event dumps (a scroll sends many), in ms. */
  scrollEveryMs?: number
  /** The most dumps a session keeps; the oldest go first. */
  cap?: number
  /**
   * How long a session runs before a new one starts, in ms: the endpoint refuses a trace whose `startedAt` is more
   * than a day old, so a chat left open longer would lose its dumps.
   */
  rotateMs?: number
}

const isChatPath = (pathname: string) => pathname === '/workspaces' || pathname === '/workspaces/'

const postJson = (endpoint: string, body: string) =>
  fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body })

const EVENTS = ['resize', 'focusin', 'focusout', 'orientationchange'] as const

/**
 * Watches the route; on `/workspaces` it checks each `everyMs` and on each event for an open chat, records one session
 * per chat open and POSTs it after each tick and when the chat closes. Returns the function that stops it.
 */
export function startHeaderTrace({
  win = window,
  route,
  endpoint = '/__keyboard-trace',
  post = postJson,
  everyMs = 3000,
  scrollEveryMs = 250,
  cap = 400,
  rotateMs = 12 * 60 * 60 * 1000,
}: HeaderTraceOptions): { stop: () => void } {
  const doc = win.document
  let session: HeaderTrace | undefined
  let title: Element | null = null
  // One POST at a time: while one is out, each session keeps only its newest snapshot, sent when the POST ends, so a
  // slow link holds at most one snapshot per session and never stacks requests beside the chat's own.
  let inFlight = false
  const waiting = new Map<string, string>()
  const upload = (body: string) => {
    inFlight = true
    post(endpoint, body)
      .catch(() => undefined)
      .finally(() => {
        inFlight = false
        const next = waiting.entries().next()
        if (next.done === true) return
        waiting.delete(next.value[0])
        upload(next.value[1])
      })
  }
  const send = () => {
    if (session === undefined) return
    const body = JSON.stringify(session)
    if (inFlight) waiting.set(session.startedAt, body)
    else upload(body)
  }
  const end = () => {
    send()
    session = undefined
    title = null
  }
  // The return from the background: the next dump after the page shows again carries it.
  let back: HeaderDump['back'] = null
  let hiddenAt: number | null = null
  const dump = (type: string) => {
    const now = chatTitle(doc)
    // A different title element is a different chat open; an old session ends before the endpoint refuses it.
    if (session !== undefined && (now !== title || Date.now() - Date.parse(session.startedAt) >= rotateMs)) end()
    if (now === null) return
    if (session === undefined) {
      title = now
      session = {
        trace: 'header',
        startedAt: new Date().toISOString(),
        userAgent: win.navigator.userAgent,
        displayMode: readDisplayMode(win),
        screenHeight: win.screen.height,
        screenWidth: win.screen.width,
        devicePixelRatio: win.devicePixelRatio,
        automated: win.navigator.webdriver,
        build: readBuild(),
        route: traceRoute(route.current()),
        samples: [],
      }
      type = 'open'
    }
    session.samples.push({ ...readHeaderDump(now, type, win), back })
    back = null
    if (session.samples.length > cap) session.samples.shift()
  }
  // Events dump in a timer, never inside the event: a resize or a scroll is when AppShell moves its keyboard dock, and
  // the dump reads layout. At most one dump each `scrollEveryMs`; the first event's type names it.
  let lastEvent = Number.NEGATIVE_INFINITY
  let eventTimer: number | undefined
  const later = (type: string) => {
    if (eventTimer !== undefined) return
    const wait = Math.max(0, lastEvent + scrollEveryMs - win.performance.now())
    eventTimer = win.setTimeout(() => {
      eventTimer = undefined
      lastEvent = win.performance.now()
      dump(type)
    }, wait)
  }
  const onEvent = (event: Event) => {
    later(event.type)
  }
  const onVisibility = () => {
    // A hidden page may never run again: dump and send at once.
    if (doc.visibilityState === 'hidden') {
      dump('visibilitychange')
      send()
      hiddenAt = win.performance.now()
    } else {
      back = { hiddenMs: hiddenAt === null ? null : win.performance.now() - hiddenAt, via: 'visibilitychange' }
      hiddenAt = null
      later('visibilitychange')
    }
  }
  const onPageShow = (event: Event) => {
    // `persisted`: the page came back from the back-forward cache.
    if (event instanceof PageTransitionEvent && event.persisted && back === null)
      back = { hiddenMs: null, via: 'pageshow' }
    later('pageshow')
  }
  const options = { capture: true, passive: true }
  let timer: number | undefined
  const listen = (on: boolean) => {
    const method = on ? 'addEventListener' : 'removeEventListener'
    for (const type of EVENTS) win[method](type, onEvent, options)
    win[method]('pageshow', onPageShow, options)
    win[method]('scroll', onEvent, options)
    doc[method]('visibilitychange', onVisibility)
    win.visualViewport?.[method]('resize', onEvent, options)
    win.visualViewport?.[method]('scroll', onEvent, options)
    if (on)
      timer = win.setInterval(() => {
        dump('tick')
        send()
      }, everyMs)
    else {
      win.clearInterval(timer)
      win.clearTimeout(eventTimer)
      eventTimer = undefined
    }
  }
  let listening = false
  const sync = () => {
    const onChat = isChatPath(route.current().pathname)
    if (onChat && !listening) {
      listen(true)
      dump('open')
    }
    if (!onChat && listening) {
      listen(false)
      if (session !== undefined) end()
    }
    listening = onChat
  }
  const unsubscribe = route.subscribe(sync)
  sync()
  return {
    stop: () => {
      unsubscribe()
      if (listening) listen(false)
      listening = false
      if (session !== undefined) end()
    },
  }
}
