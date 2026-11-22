// The keyboard trace, a dev-only debug mode for the phone keyboard. main.ts
// imports this module only when `import.meta.env.DEV` is true and the URL
// has `?keyboard-trace` or the dev server's switch is on
// (keyboardTraceSwitch.ts), so a build leaves it out. It only reads: one
// sample on each animation frame and on the focus, pointer, resize and scroll
// events (each with the document's scroll, the tops of `#root` and the
// composer, so a page that iOS moves shows, the keyboard's top and the
// shell's last dock target), a small overlay with the live values (the param only), and a POST of
// the whole trace every 2 s to the dev server's endpoint
// (scripts/keyboardTracePlugin.ts), which writes it to disk. With the param
// it traces the whole page; from the switch keyboardChatTrace.ts runs one
// short trace per keyboard open in a Workspaces chat, with the same recorder.

import { appShellDockEvent } from '@eshelton328/component-library-1701'

/**
 * The build, as the dev server's plugin defines it when it starts (scripts/keyboardTracePlugin.ts); undefined where
 * no plugin ran it (a test without the plugin, a build).
 */
declare const __KEYBOARD_TRACE_BUILD__: KeyboardTraceBuild | undefined

/** One reading of the viewport and the shell's keyboard inset. */
export type KeyboardTraceSample = {
  /** `performance.now()`, in ms. */
  t: number
  /** The event type, `vv-resize` or `vv-scroll` for the visual viewport's, or `raf`. */
  type: string
  innerHeight: number
  vvHeight: number | null
  vvOffsetTop: number | null
  vvPageTop: number | null
  scrollY: number
  /** `document.scrollingElement.scrollTop`: the document's scroll as the layout has it; null with no scrolling element. */
  scrollTop: number | null
  /** The top of `#root`'s box in the layout viewport; the app's root is fixed there, so anything but 0 is a moved page. Null with no `#root`. */
  rootTop: number | null
  /** The top of the composer's box (the `data-keyboard-keep` wrapper in a ScrollFrame footer) in the layout viewport; null with none. */
  composerTop: number | null
  /** The computed `--app-shell-keyboard` of `.app-shell__root`; empty when there is none. */
  keyboard: string
  /**
   * The keyboard's top in layout px, `visualViewport.offsetTop + visualViewport.height`: the bottom of what the
   * keyboard leaves visible. Null with no `visualViewport`.
   */
  keyboardTop: number | null
  /**
   * The inset the shell's keyboard dock moves to, from the last `appShellDockEvent` (`detail.inset`, CSS px; 0 for a
   * close). Null before the first.
   */
  dockInset: number | null
  /** Focus and pointer events only: the target's tag name and role, never its text, value, name or id. */
  targetTag?: string
  targetRole?: string | null
}

/** The build the trace ran on: the served tree's commit and the component library's version, null when unknown. */
export type KeyboardTraceBuild = { commit: string | null; libraryVersion: string | null }

/** The safe-area insets, in px, as `env(safe-area-inset-*)` gives them. */
type SafeArea = { top: number; right: number; bottom: number; left: number }

/** Where a chat session ran: the path and the `state` search param only, null when there is none. */
export type TraceRoute = { pathname: string; state: string | null }

/** The chat a session traced: the Workspaces state key (null for the default) and the layout it drew. */
export type TraceChat = { state: string | null; device: 'phone' | 'tablet' }

/** What the trace records once, at its start, beside the samples. */
export type KeyboardTraceHeader = {
  startedAt: string
  userAgent: string
  /** `standalone` in the installed Home Screen app, else `browser`. */
  displayMode: 'standalone' | 'browser'
  screenHeight: number
  screenWidth: number
  devicePixelRatio: number
  safeArea: SafeArea
  /** Whether `prefers-reduced-motion: reduce` matches. */
  reducedMotion: boolean
  /** The `kb-experiment` search param when it is a short key (`KB_EXPERIMENT`), else null; no other search param is read. */
  kbExperiment: string | null
  /** True when `navigator.webdriver` is: a trace from Playwright or other automation. */
  automated: boolean
  /** The build, read when the dev server started; both fields null where the server defined none. */
  build: KeyboardTraceBuild
  /** A chat session only (keyboardChatTrace.ts). */
  route?: TraceRoute
  /** A chat session only (keyboardChatTrace.ts). */
  chat?: TraceChat
}

/** The trace the endpoint takes. */
export type KeyboardTrace = KeyboardTraceHeader & { samples: KeyboardTraceSample[] }

/** A ring buffer: keeps the last `cap` items. */
export type Ring<T> = { push: (item: T) => void; toArray: () => T[]; readonly size: number }

export function createRing<T>(cap: number): Ring<T> {
  const items: T[] = []
  let next = 0
  return {
    push(item) {
      if (items.length < cap) items.push(item)
      else items[next] = item
      next = (next + 1) % cap
    },
    toArray: () => (items.length < cap ? [...items] : [...items.slice(next), ...items.slice(0, next)]),
    get size() {
      return items.length
    },
  }
}

const round = (n: number) => Math.round(n * 10) / 10

/** The build the dev server defined, or nulls where it defined none. */
export function readBuild(): KeyboardTraceBuild {
  return typeof __KEYBOARD_TRACE_BUILD__ === 'undefined'
    ? { commit: null, libraryVersion: null }
    : { commit: __KEYBOARD_TRACE_BUILD__.commit, libraryVersion: __KEYBOARD_TRACE_BUILD__.libraryVersion }
}

/**
 * Reads one sample from `win`. For a focus event, `target` gives only its tag name and role. `dockInset` is the last
 * dock target the recorder saw; it reads no layout, nor does `keyboardTop` (visual viewport fields only).
 */
export function readSample(
  type: string,
  target: EventTarget | null,
  win: Window = window,
  dockInset: number | null = null,
): KeyboardTraceSample {
  const vv = win.visualViewport
  const doc = win.document
  const root = doc.querySelector('.app-shell__root')
  const top = (element: Element | null) => (element === null ? null : round(element.getBoundingClientRect().top))
  const sample: KeyboardTraceSample = {
    t: round(win.performance.now()),
    type,
    innerHeight: win.innerHeight,
    vvHeight: vv === null ? null : round(vv.height),
    vvOffsetTop: vv === null ? null : round(vv.offsetTop),
    vvPageTop: vv === null ? null : round(vv.pageTop),
    scrollY: round(win.scrollY),
    scrollTop: doc.scrollingElement === null ? null : round(doc.scrollingElement.scrollTop),
    rootTop: top(doc.getElementById('root')),
    composerTop: top(doc.querySelector('.scroll-frame__footer [data-keyboard-keep]')),
    keyboard: root === null ? '' : win.getComputedStyle(root).getPropertyValue('--app-shell-keyboard').trim(),
    keyboardTop: vv === null ? null : round(vv.offsetTop + vv.height),
    dockInset,
  }
  if (type === 'focusin' || type === 'focusout' || type === 'pointerdown' || type === 'pointerup') {
    sample.targetTag = target instanceof Element ? target.tagName.toLowerCase() : target === null ? 'none' : 'window'
    sample.targetRole = target instanceof Element ? target.getAttribute('role') : null
  }
  return sample
}

/** `standalone` when the app runs from the Home Screen (the display-mode query, or iOS's `navigator.standalone`). */
export function readDisplayMode(win: Window = window): KeyboardTraceHeader['displayMode'] {
  const fromQuery = typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches
  return fromQuery || Reflect.get(win.navigator, 'standalone') === true ? 'standalone' : 'browser'
}

/** A `kb-experiment` key: letters, digits, `_` and `-`, at most 32, so no free text gets in. */
const KB_EXPERIMENT = /^[A-Za-z0-9_-]{1,32}$/

/** The `kb-experiment` search param when it is a short key, a label for a trace taken in a browser; else null. */
export function readKbExperiment(win: Window = window): string | null {
  const value = new URLSearchParams(win.location.search).get('kb-experiment')
  return value !== null && KB_EXPERIMENT.test(value) ? value : null
}

/** Whether the user asks for reduced motion. */
function readReducedMotion(win: Window = window): boolean {
  return typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const px = (value: string) => {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? round(n) : 0
}

const nextFrame = (win: Window) =>
  new Promise<void>((done) => {
    win.requestAnimationFrame(() => {
      done()
    })
  })

/** How long the probe waits for its two frames, in ms: a hidden page runs no frame, and its last POST waits on the read. */
const PROBE_FRAMES_MS = 250

/**
 * Reads `env(safe-area-inset-*)` through a hidden probe: it appends the probe, waits two animation frames so the page
 * has laid it out (at most 250 ms, as a hidden page runs none), reads the probe's computed padding and removes it. `env()` is 0 on every side unless the viewport
 * meta has `viewport-fit=cover`.
 */
export async function readSafeArea(win: Window = window): Promise<SafeArea> {
  const doc = win.document
  const probe = doc.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.setAttribute('data-keyboard-trace-probe', '')
  // Fixed and hidden, so it takes no room and no tap while it is read.
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
  doc.body.append(probe)
  try {
    let timer = 0
    await Promise.race([
      nextFrame(win).then(() => nextFrame(win)),
      new Promise<void>((done) => {
        timer = win.setTimeout(done, PROBE_FRAMES_MS)
      }),
    ])
    win.clearTimeout(timer)
    const style = win.getComputedStyle(probe)
    return {
      top: px(style.paddingTop),
      right: px(style.paddingRight),
      bottom: px(style.paddingBottom),
      left: px(style.paddingLeft),
    }
  } finally {
    probe.remove()
  }
}

/** The header's fields read at once: everything but the safe area, which needs a layout. */
function readHeaderNow(win: Window, startedAt: string): Omit<KeyboardTraceHeader, 'safeArea'> {
  return {
    startedAt,
    userAgent: win.navigator.userAgent,
    displayMode: readDisplayMode(win),
    screenHeight: win.screen.height,
    screenWidth: win.screen.width,
    devicePixelRatio: win.devicePixelRatio,
    reducedMotion: readReducedMotion(win),
    kbExperiment: readKbExperiment(win),
    automated: win.navigator.webdriver,
    build: readBuild(),
  }
}

/**
 * The trace's header: its start time, the browser, the display mode, the screen, the safe area, reduced motion, the
 * `kb-experiment` key, whether automation runs the page and the build.
 */
export async function readHeader(
  win: Window = window,
  startedAt: string = new Date().toISOString(),
): Promise<KeyboardTraceHeader> {
  const now = readHeaderNow(win, startedAt)
  return { ...now, safeArea: await readSafeArea(win) }
}

const WINDOW_EVENTS = ['focusin', 'focusout', 'pointerdown', 'pointerup', 'resize', 'scroll'] as const
const VIEWPORT_EVENTS = ['resize', 'scroll'] as const

export type TraceOptions = {
  win?: Window
  cap?: number
  postEveryMs?: number
  endpoint?: string
  post?: (endpoint: string, body: string) => Promise<unknown>
  overlay?: boolean
  /** The build to record; the dev server's define by default. */
  build?: KeyboardTraceBuild
}

const postJson = (endpoint: string, body: string) =>
  fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body })

function makeOverlay(doc: Document): HTMLElement {
  const el = doc.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.setAttribute('data-keyboard-trace', '')
  el.inert = true
  // A debug readout outside the design: fixed, so it takes no room, and never hit by a tap.
  el.style.cssText =
    'position:fixed;top:env(safe-area-inset-top,0);right:0;z-index:2147483647;pointer-events:none;' +
    'margin:0;padding:2px 4px;font:10px/1.25 ui-monospace,monospace;white-space:pre;' +
    'background:rgba(0,0,0,0.7);color:#fff;user-select:none'
  doc.body.append(el)
  return el
}

function overlayText(s: KeyboardTraceSample, count: number, sent: string): string {
  return [
    `vv h ${String(s.vvHeight)} top ${String(s.vvOffsetTop)} page ${String(s.vvPageTop)}`,
    `inner ${String(s.innerHeight)} scrollY ${String(s.scrollY)}`,
    `kb ${s.keyboard || '-'} top ${String(s.keyboardTop)} dock ${String(s.dockInset)}  n ${String(count)}  ${sent}`,
  ].join('\n')
}

/** A running recording: `record` adds a sample by hand, `stop` ends it, with one last POST when `flush` is set. */
export type Recording = {
  stop: (end?: { flush?: boolean }) => void
  trace: () => KeyboardTrace
  record: (type: string, target: EventTarget | null) => void
}

/**
 * Records one trace: reads its header (the safe area after a layout), samples each event and frame, and POSTs the
 * whole trace every `postEveryMs`, skipping a tick while a POST is out, and at once when the page is hidden. No POST
 * goes before the header is read. `onSample` sees each sample, for a session that ends itself.
 */
export function recordKeyboardTrace({
  win = window,
  cap = 20000,
  postEveryMs = 2000,
  endpoint = '/__keyboard-trace',
  post = postJson,
  overlay = true,
  build,
  extra = {},
  onSample,
}: TraceOptions & {
  /** Header fields beside the read ones, such as a chat session's `route` and `chat`. */
  extra?: Pick<KeyboardTraceHeader, 'route' | 'chat'>
  onSample?: (sample: KeyboardTraceSample) => void
} = {}): Recording {
  const ring = createRing<KeyboardTraceSample>(cap)
  // Read now, at the trace's start; the safe area replaces the zeros once the probe has a layout.
  let header: KeyboardTraceHeader = {
    ...readHeaderNow(win, new Date().toISOString()),
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    ...(build === undefined ? {} : { build }),
    ...extra,
  }
  const ready = readSafeArea(win).then(
    (safeArea) => {
      header = { ...header, safeArea }
    },
    () => undefined,
  )
  const trace = (): KeyboardTrace => ({ ...header, samples: ring.toArray() })
  const view = overlay ? makeOverlay(win.document) : undefined
  let sent = 'not sent'
  // The dock's target inset from the last `appShellDockEvent`, carried into each sample.
  let dockInset: number | null = null
  const record = (type: string, target: EventTarget | null) => {
    const sample = readSample(type, target, win, dockInset)
    ring.push(sample)
    onSample?.(sample)
    return sample
  }
  const onWindow = (event: Event) => record(event.type, event.target)
  const onViewport = (event: Event) => record(`vv-${event.type}`, null)
  // The shell sends the dock event to its root without bubbling; a capture listener on the window still sees it.
  // It only keeps the inset for the next sample: a sample here would read layout while the shell starts its move.
  const onDock = (event: Event) => {
    const detail: unknown = event instanceof CustomEvent ? event.detail : undefined
    const inset: unknown = typeof detail === 'object' && detail !== null ? Reflect.get(detail, 'inset') : undefined
    dockInset = typeof inset === 'number' && Number.isFinite(inset) ? round(inset) : null
  }
  const options = { capture: true, passive: true }
  for (const type of WINDOW_EVENTS) win.addEventListener(type, onWindow, options)
  win.addEventListener(appShellDockEvent, onDock, options)
  for (const type of VIEWPORT_EVENTS) win.visualViewport?.addEventListener(type, onViewport, options)

  let frame = 0
  const onFrame = () => {
    const sample = record('raf', null)
    if (view) view.textContent = overlayText(sample, ring.size, sent)
    frame = win.requestAnimationFrame(onFrame)
  }
  frame = win.requestAnimationFrame(onFrame)

  // The timer skips a tick while a POST is out. A hidden page may never run
  // again, so it sends its last snapshot at once; the endpoint keeps the
  // trace with the latest sample when two POSTs land out of order.
  let inFlight = false
  const send = (force = false) => {
    if (inFlight && !force) return
    inFlight = true
    // The samples as they are now; the header joins them once the safe area is read.
    const samples = ring.toArray()
    ready
      .then(() => post(endpoint, JSON.stringify({ ...header, samples })))
      .then((res) => {
        sent = res instanceof Response && !res.ok ? `post ${String(res.status)}` : `sent ${String(ring.size)}`
      })
      .catch(() => {
        sent = 'post failed'
      })
      .finally(() => {
        inFlight = false
      })
  }
  const timer = win.setInterval(() => {
    send()
  }, postEveryMs)
  const onHidden = () => {
    if (win.document.visibilityState === 'hidden') send(true)
  }
  win.document.addEventListener('visibilitychange', onHidden)

  let stopped = false
  const stop = ({ flush = false }: { flush?: boolean } = {}) => {
    if (stopped) return
    stopped = true
    win.cancelAnimationFrame(frame)
    win.clearInterval(timer)
    win.document.removeEventListener('visibilitychange', onHidden)
    for (const type of WINDOW_EVENTS) win.removeEventListener(type, onWindow, options)
    win.removeEventListener(appShellDockEvent, onDock, options)
    for (const type of VIEWPORT_EVENTS) win.visualViewport?.removeEventListener(type, onViewport, options)
    view?.remove()
    if (flush) send(true)
  }
  return {
    stop,
    trace,
    record: (type, target) => {
      record(type, target)
    },
  }
}

/** Starts the whole-page trace of `?keyboard-trace`; returns the function that stops it and removes every listener and the overlay. */
export function startKeyboardTrace(options: TraceOptions = {}): { stop: () => void; trace: () => KeyboardTrace } {
  const recording = recordKeyboardTrace(options)
  return {
    stop: () => {
      recording.stop()
    },
    trace: recording.trace,
  }
}
