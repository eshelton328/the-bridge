// A live Claude chat's terminal dialog (R69, the contract's paneDialogs.ts):
// `GET /api/chats/:chat/dialog` reads the dialog on the chat's screen that
// its transcript does not hold (`PaneDialogResponse`, `dialog` null when
// none), and `POST /api/chats/:chat/dialog` with `AnswerDialogRequest`
// (`{ id, n }`) sends the option the owner tapped (204). The page never
// sends an option without a tap.
//
// The pane asks for the reads (`ChatDialog.watch`) only while the chat
// needs the owner and its transcript has no open question
// (blocks/chatDialog.ts). Then the page reads at once, every
// `dialogPollMs` (3 s) while the page shows, and at once when it shows again
// after the background; one read at a time for each chat, and the last pane
// that stops watching aborts the read and forgets the dialog. A read that
// answers 404 (a server without the route, or a chat that left the list)
// stops the reads until the next watch.
//
// An answer's 204 reads again at once; a 409 `dialogChanged` shows "The
// terminal changed — showing the new state" and waits for the next read,
// which brings the new dialog. Another 409 `chat-not-ready` shows "Not sent
// — <state>" with no Retry, and the next read decides. Any other miss is a
// line by kind, "Not sent — <kind>", with Retry for no answer, a 5xx or a
// 429. Every reply is parsed with the contract's schemas (`PaneDialogResponse`,
// `ErrorBody`), and the body is `AnswerDialogRequest`'s; a read the schema
// refuses keeps the card as it was (none at first) and reports `bad-reply`.
// The calls go through the typed client (`api.api.chats[':chat'].dialog`). report() gets a DialogMissError for a 5xx and for an answer the page
// does not expect, once a watch for a read, with the step, the kind and the
// HTTP status only: never the dialog's text, an option's label or the chat
// ID. The chat ID goes in the path URL-encoded once.
import { AnswerDialogRequest, ErrorBody, type PaneDialog, PaneDialogResponse } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import type { ChatDialog, DialogPhase, DialogView } from './blocks/chatDialog.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** How often the page reads a blocked chat's dialog while it shows, in ms. */
export const dialogPollMs = 3000
/** How long an answer may take before the page counts it as no answer, in ms. */
export const dialogAnswerTimeoutMs = 15_000

/** A dialog read or answer that missed, for report(): the step, the kind and the HTTP status, and nothing else. */
class DialogMissError extends Error {
  readonly step: 'read' | 'answer'
  readonly miss: string
  readonly status: number | undefined

  constructor(step: 'read' | 'answer', kind: string, status: number | undefined) {
    super(`A chat dialog ${step} missed: ${kind}${status === undefined ? '' : ` (${String(status)})`}`)
    this.name = 'DialogMissError'
    this.step = step
    this.miss = kind
    this.status = status
  }
}

type Answered = {
  readonly id: string
  readonly n: number
  readonly phase: Exclude<DialogPhase, 'ready'>
  readonly line?: string | undefined
  readonly retry?: boolean | undefined
}

type ChatState = {
  readonly listeners: Set<() => void>
  dialog: PaneDialog | undefined
  answered: Answered | undefined
  shown: DialogView | undefined
  watchers: number
  timer: ReturnType<typeof setInterval> | undefined
  reading: AbortController | undefined
  /** The read kinds reported in this watch. */
  readonly reported: Set<string>
  onVisible: (() => void) | undefined
}

const chats = new Map<string, ChatState>()

function stateOf(chat: string): ChatState {
  const known = chats.get(chat)
  if (known !== undefined) return known
  const made: ChatState = {
    listeners: new Set(),
    dialog: undefined,
    answered: undefined,
    shown: undefined,
    watchers: 0,
    timer: undefined,
    reading: undefined,
    reported: new Set(),
    onVisible: undefined,
  }
  chats.set(chat, made)
  return made
}

/** Builds the card's view again from the dialog and the answer, and tells the panes. */
function changed(state: ChatState) {
  const { dialog, answered } = state
  state.shown =
    dialog === undefined
      ? undefined
      : answered?.phase === 'sending'
        ? // While an answer is on its way every option is off, also those of a dialog a read brought meanwhile.
          { dialog, phase: 'sending' }
        : answered?.id === dialog.id
          ? { dialog, phase: answered.phase, line: answered.line, retry: answered.retry }
          : { dialog, phase: 'ready' }
  for (const listener of [...state.listeners]) listener()
}

const param = (chat: string) => ({ chat: encodeURIComponent(chat) })

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden'

/** Stops the reads of `state`'s watch: the timer, the visibility listener and the read on its way. */
function stopReads(state: ChatState) {
  if (state.timer !== undefined) clearInterval(state.timer)
  state.timer = undefined
  if (state.onVisible !== undefined) document.removeEventListener('visibilitychange', state.onVisible)
  state.onVisible = undefined
  state.reading?.abort()
  state.reading = undefined
}

/** The answer of a dialog read: its status and its body as text, or none when no answer came in time. */
async function fetchDialog(chat: string, signal: AbortSignal): Promise<{ status: number; text: string } | undefined> {
  try {
    const res = await api.api.chats[':chat'].dialog.$get(
      { param: param(chat) },
      { init: { signal: AbortSignal.any([signal, AbortSignal.timeout(liveReadTimeoutMs)]) } },
    )
    return { status: res.status, text: res.status === 404 ? '' : await res.text() }
  } catch {
    // No answer, or none in time: the card keeps what it shows, and the next read tries again.
    return undefined
  }
}

/** One read of `chat`'s dialog, unless one runs or the page is hidden. */
async function read(chat: string, state: ChatState) {
  if (state.reading !== undefined || state.watchers === 0 || hidden()) return
  const reading = new AbortController()
  state.reading = reading
  const answer = await fetchDialog(chat, reading.signal)
  if (state.reading === reading) state.reading = undefined
  if (answer === undefined || reading.signal.aborted) return
  const missOnce = (kind: string) => {
    if (state.reported.has(kind)) return
    state.reported.add(kind)
    report(new DialogMissError('read', kind, answer.status), 'live')
  }
  if (answer.status === 404) {
    // A server without the route, or a chat that left the list: no card, and no reads until the next watch.
    stopReads(state)
    state.dialog = undefined
    changed(state)
    return
  }
  if (answer.status < 200 || answer.status > 299) {
    // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
    const body = ErrorBody.safeParse(readJson(answer.text)).success
    missOnce(body || answer.status < 500 ? 'status' : 'unreachable')
    return
  }
  const parsed = PaneDialogResponse.safeParse(readJson(answer.text))
  if (!parsed.success) {
    missOnce('bad-reply')
    return
  }
  const next = parsed.data.dialog ?? undefined
  if (next?.id !== state.dialog?.id || (next === undefined) !== (state.dialog === undefined)) {
    state.dialog = next
    // A done answer belongs to the dialog it answered: a dialog that goes, or another one, ends it, so the same text
    // on the screen again later is a new question with its options on. An answer still on its way stays.
    if (state.answered !== undefined && state.answered.phase !== 'sending') state.answered = undefined
    changed(state)
  }
}

/** What an answer that missed shows: its line and whether Retry may work. */
const failed = (state: ChatState, id: string, n: number, kind: string, retry: boolean) => {
  state.answered = { id, n, phase: 'failed', line: `Not sent — ${kind}`, retry }
  changed(state)
}

/** Sends the option `n` of the dialog `chat` shows; the owner tapped it. */
async function answer(chat: string, state: ChatState, n: number) {
  const dialog = state.dialog
  if (dialog === undefined || state.answered?.phase === 'sending') return
  if (state.answered?.id === dialog.id && (state.answered.phase === 'sent' || state.answered.phase === 'changed'))
    return
  if (dialog.options?.some((o) => o.n === n) !== true) return
  const id = dialog.id
  state.answered = { id, n, phase: 'sending' }
  changed(state)
  let res: { readonly status: number; text: () => Promise<string> }
  try {
    res = await api.api.chats[':chat'].dialog.$post(
      { param: param(chat), json: AnswerDialogRequest.parse({ id, n }) },
      { init: { signal: AbortSignal.timeout(dialogAnswerTimeoutMs) } },
    )
  } catch (error) {
    failed(
      state,
      id,
      n,
      error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'unreachable',
      true,
    )
    return
  }
  if (res.status === 204) {
    state.answered = { id, n, phase: 'sent' }
    changed(state)
    void read(chat, state)
    return
  }
  const body = ErrorBody.safeParse(readJson(await res.text().catch(() => '')))
  const error = body.success ? body.data.error : undefined
  const kind = error?.kind
  if (res.status === 409 && error?.kind === 'chat-not-ready') {
    if (error.state === 'dialogChanged') {
      // The screen no longer shows that dialog: the next read shows what it shows now.
      state.answered = { id, n, phase: 'changed' }
      changed(state)
      return
    }
    // The chat cannot take an answer now (it works, it restarts…): its own line, and the next read decides.
    failed(state, id, n, error.state, false)
    return
  }
  if (res.status === 404) {
    failed(state, id, n, 'that chat is gone', false)
    return
  }
  if (res.status === 429) {
    failed(state, id, n, kind ?? 'rate-limited', true)
    return
  }
  if (res.status >= 500) {
    report(new DialogMissError('answer', kind ?? 'unreachable', res.status), 'live')
    failed(state, id, n, kind ?? 'unreachable', true)
    return
  }
  report(new DialogMissError('answer', kind ?? 'status', res.status), 'live')
  failed(state, id, n, kind ?? 'status', false)
}

/** The dialog of the live chat `chat` (its server ID), for its pane. */
export function chatDialogOf(chat: string): ChatDialog {
  const state = stateOf(chat)
  return {
    subscribe: (listener) => {
      state.listeners.add(listener)
      return () => {
        state.listeners.delete(listener)
      }
    },
    view: () => state.shown,
    watch: () => {
      state.watchers += 1
      if (state.watchers === 1) {
        state.reported.clear()
        const onVisible = () => {
          if (!hidden()) void read(chat, state)
        }
        state.onVisible = onVisible
        document.addEventListener('visibilitychange', onVisible)
        state.timer = setInterval(() => void read(chat, state), dialogPollMs)
        void read(chat, state)
      }
      let stopped = false
      return () => {
        if (stopped) return
        stopped = true
        state.watchers -= 1
        if (state.watchers > 0) return
        stopReads(state)
        // A chat that needs the owner again later shows only what a new read finds.
        state.dialog = undefined
        if (state.answered?.phase !== 'sending') state.answered = undefined
        changed(state)
      }
    },
    answer: (n) => void answer(chat, state, n),
    retry: () => {
      const answered = state.answered
      if (answered?.phase !== 'failed' || answered.id !== state.dialog?.id) return
      void answer(chat, state, answered.n)
    },
  }
}
