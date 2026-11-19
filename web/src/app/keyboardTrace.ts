// `?keyboard-trace`, a dev-only debug mode for the phone keyboard. main.ts
// imports this module only when `import.meta.env.DEV` is true and the URL
// has the param, so a build leaves it out. It only reads: one sample on
// each animation frame and on the focus, pointer, resize and scroll events,
// a small overlay with the live values, and a POST of the whole trace every
// 2 s to the dev server's endpoint (scripts/keyboardTracePlugin.ts), which
// writes it to disk.

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
  /** The computed `--app-shell-keyboard` of `.app-shell__root`; empty when there is none. */
  keyboard: string
  /** Focus events only: the target's tag name and role, never its text, value, name or id. */
  targetTag?: string
  targetRole?: string | null
}

/** The trace the endpoint takes. */
export type KeyboardTrace = { startedAt: string; userAgent: string; samples: KeyboardTraceSample[] }

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

/** Reads one sample from `win`. For a focus event, `target` gives only its tag name and role. */
export function readSample(type: string, target: EventTarget | null, win: Window = window): KeyboardTraceSample {
  const vv = win.visualViewport
  const root = win.document.querySelector('.app-shell__root')
  const sample: KeyboardTraceSample = {
    t: round(win.performance.now()),
    type,
    innerHeight: win.innerHeight,
    vvHeight: vv === null ? null : round(vv.height),
    vvOffsetTop: vv === null ? null : round(vv.offsetTop),
    vvPageTop: vv === null ? null : round(vv.pageTop),
    scrollY: round(win.scrollY),
    keyboard: root === null ? '' : win.getComputedStyle(root).getPropertyValue('--app-shell-keyboard').trim(),
  }
  if (type === 'focusin' || type === 'focusout') {
    sample.targetTag = target instanceof Element ? target.tagName.toLowerCase() : target === null ? 'none' : 'window'
    sample.targetRole = target instanceof Element ? target.getAttribute('role') : null
  }
  return sample
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
    `kb ${s.keyboard || '-'}  n ${String(count)}  ${sent}`,
  ].join('\n')
}

/** Starts the trace; returns the function that stops it and removes every listener and the overlay. */
export function startKeyboardTrace({
  win = window,
  cap = 20000,
  postEveryMs = 2000,
  endpoint = '/__keyboard-trace',
  post = postJson,
  overlay = true,
}: TraceOptions = {}): { stop: () => void; trace: () => KeyboardTrace } {
  const ring = createRing<KeyboardTraceSample>(cap)
  const startedAt = new Date().toISOString()
  const trace = (): KeyboardTrace => ({ startedAt, userAgent: win.navigator.userAgent, samples: ring.toArray() })
  const view = overlay ? makeOverlay(win.document) : undefined
  let sent = 'not sent'
  const record = (type: string, target: EventTarget | null) => {
    const sample = readSample(type, target, win)
    ring.push(sample)
    return sample
  }
  const onWindow = (event: Event) => record(event.type, event.target)
  const onViewport = (event: Event) => record(`vv-${event.type}`, null)
  const options = { capture: true, passive: true }
  for (const type of WINDOW_EVENTS) win.addEventListener(type, onWindow, options)
  for (const type of VIEWPORT_EVENTS) win.visualViewport?.addEventListener(type, onViewport, options)

  let frame = 0
  const onFrame = () => {
    const sample = record('raf', null)
    if (view) view.textContent = overlayText(sample, ring.size, sent)
    frame = win.requestAnimationFrame(onFrame)
  }
  frame = win.requestAnimationFrame(onFrame)

  let inFlight = false
  const send = () => {
    if (inFlight) return
    inFlight = true
    post(endpoint, JSON.stringify(trace()))
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
  const timer = win.setInterval(send, postEveryMs)
  const onHidden = () => {
    if (win.document.visibilityState === 'hidden') send()
  }
  win.document.addEventListener('visibilitychange', onHidden)

  const stop = () => {
    win.cancelAnimationFrame(frame)
    win.clearInterval(timer)
    win.document.removeEventListener('visibilitychange', onHidden)
    for (const type of WINDOW_EVENTS) win.removeEventListener(type, onWindow, options)
    for (const type of VIEWPORT_EVENTS) win.visualViewport?.removeEventListener(type, onViewport, options)
    view?.remove()
  }
  return { stop, trace }
}
