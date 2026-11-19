// The keyboard trace from the dev server's switch (keyboardTraceSwitch.ts):
// one short trace per keyboard open in a Workspaces chat, so each file the
// endpoint writes matches one open. Dev only, and imported dynamically, as
// keyboardTrace.ts is. It only reads.
//
// - Route: only `/workspaces`. On any other route it holds only the router
//   subscription that tells it the route changed: no DOM listener, frame,
//   timer or POST.
// - Chat open: on `/workspaces` one capture `focusin` listener waits for the
//   chat's composer, the textarea in the `[data-keyboard-keep]` composer of
//   the ScrollFrame footer that is the AppShell detail's own child, in a
//   phone or tablet AppShell. WorkspacesPhone draws that frame only for an
//   open chat (`ui.phoneView: 'chat'`, PhoneChat), so the desktop panes, New
//   chat and the list never start a session.
// - Session: starts at that `focusin`, with its own `startedAt` and header.
//   The keyboard counts as closed once the composer has lost the focus and
//   `visualViewport.height` is back to its value at the `focusin` (within
//   1 px), or, after a rotation changed the width, to `innerHeight`, a
//   reading independent of AppShell, which the trace is there to check. The session stops 2 s after that, with one last POST; a focus
//   back in the composer within the 2 s keeps the same session.
import {
  type Recording,
  recordKeyboardTrace,
  type TraceChat,
  type TraceOptions,
  type TraceRoute,
} from './keyboardTrace.ts'

/** The route the chat sessions run on. */
const CHAT_PATH = '/workspaces'

/** The route as the router has it: the path and the raw search string. */
export type RouteSource = {
  current: () => { pathname: string; search: string }
  /** Calls `onChange` after each navigation; returns the function that stops it. */
  subscribe: (onChange: () => void) => () => void
}

export type ChatTraceOptions = Omit<TraceOptions, 'overlay' | 'win'> & {
  win?: Window
  route: RouteSource
  /** How long after the keyboard closes the session stops, in ms. */
  closeDelayMs?: number
}

const isChatPath = (pathname: string) => pathname === CHAT_PATH || pathname === `${CHAT_PATH}/`

/** A Workspaces state key, such as `phoneChatFull`; any other value of `?state=` is recorded as null. */
const STATE_KEY = /^[A-Za-z][A-Za-z0-9]{0,63}$/

/** The route of the header: the path and the `state` search param only, never another query value. */
export function traceRoute(current: { pathname: string; search: string }): TraceRoute {
  const state = new URLSearchParams(current.search).get('state')
  return { pathname: current.pathname, state: state !== null && STATE_KEY.test(state) ? state : null }
}

/** The composer's frame: a ScrollFrame footer, the frame the AppShell detail's own child, in a phone or tablet shell. */
const COMPOSER_FOOTER =
  ':is(.app-shell__root--size_phone, .app-shell__root--size_tablet) > .app-shell__detail > .scroll-frame__root > .scroll-frame__footer'

/** The proxy field of the `proxy` keyboard experiment (keyboardExperiment.ts), which takes the focus for the composer. */
const PROXY = '[data-keyboard-experiment-proxy]'

/**
 * The layout of the chat whose composer `target` is, or undefined when it is not a phone or tablet chat's composer.
 * The keyboard experiment's proxy field counts as the composer of the chat on the page, so a session starts at the
 * focus that opens the keyboard.
 */
export function chatComposerDevice(target: EventTarget | null): TraceChat['device'] | undefined {
  if (!(target instanceof HTMLTextAreaElement)) return undefined
  const proxied = target.matches(PROXY)
  const footer = proxied ? target.ownerDocument.querySelector(COMPOSER_FOOTER) : target.closest(COMPOSER_FOOTER)
  const keep = proxied ? (footer?.querySelector('[data-keyboard-keep]') ?? null) : target.closest('[data-keyboard-keep]')
  if (footer === null || keep === null || !footer.contains(keep)) return undefined
  const root = footer.closest('.app-shell__root')
  return root?.classList.contains('app-shell__root--size_phone') === true ? 'phone' : 'tablet'
}

/** Watches the route and runs one trace session per keyboard open in a Workspaces chat; returns the function that ends it. */
export function startChatKeyboardTrace({ win = window, route, closeDelayMs = 2000, ...trace }: ChatTraceOptions): {
  stop: () => void
} {
  const doc = win.document
  let session: { end: () => void; reopen: () => void } | undefined

  const startSession = (target: EventTarget, device: TraceChat['device'], startType = 'focusin') => {
    const where = traceRoute(route.current())
    const baseline = win.visualViewport?.height ?? null
    const baselineWidth = win.visualViewport?.width ?? null
    let closeTimer: number | undefined
    let ended = false
    const closed = () => {
      if (chatComposerDevice(doc.activeElement) !== undefined) return false
      const vv = win.visualViewport
      if (baseline === null || baselineWidth === null || vv === null) return true
      if (vv.height >= baseline - 1) return true
      // A rotation changes the width, and the closed height is then the layout's, which iOS keeps under the keyboard.
      return Math.abs(vv.width - baselineWidth) > 1 && vv.height >= win.innerHeight - 1
    }
    const onSample = () => {
      if (closeTimer === undefined && !ended && closed())
        closeTimer = win.setTimeout(() => {
          end()
        }, closeDelayMs)
    }
    const recording: Recording = recordKeyboardTrace({
      ...trace,
      win,
      overlay: false,
      extra: { route: where, chat: { state: where.state, device } },
      onSample,
    })
    // The focusin that starts the session has passed the window, where the recording listens; `focused` when the
    // composer already had the focus as the listener was added.
    recording.record(startType, target)
    const end = () => {
      if (ended) return
      ended = true
      win.clearTimeout(closeTimer)
      recording.stop({ flush: true })
      if (session === current) session = undefined
    }
    const current = {
      end,
      reopen: () => {
        win.clearTimeout(closeTimer)
        closeTimer = undefined
      },
    }
    return current
  }

  const onFocusIn = (event: Event) => {
    const device = chatComposerDevice(event.target)
    if (device === undefined || event.target === null) return
    if (session) session.reopen()
    else session = startSession(event.target, device)
  }

  let listening = false
  const sync = () => {
    const onChat = isChatPath(route.current().pathname)
    if (onChat && !listening) {
      doc.addEventListener('focusin', onFocusIn, true)
      // The composer can take the focus before the switch has answered or the route has resolved.
      const focused = doc.activeElement
      const device = chatComposerDevice(focused)
      if (device !== undefined && focused !== null && session === undefined)
        session = startSession(focused, device, 'focused')
    }
    if (!onChat && listening) {
      doc.removeEventListener('focusin', onFocusIn, true)
      session?.end()
    }
    listening = onChat
  }
  const unsubscribe = route.subscribe(sync)
  sync()
  return {
    stop: () => {
      unsubscribe()
      doc.removeEventListener('focusin', onFocusIn, true)
      listening = false
      session?.end()
    },
  }
}
