// The pending send of a live Claude chat: the owner's message shows in the
// transcript the moment he taps Send, as a pending bubble with its file chips
// and "Sending…", while `POST /api/chats/:chat/prompt` answers (about 1 s from
// the phone) and the transcript stream brings the prompt's own entry.
//
// The bubble goes in the same render as that entry comes: the view is worked
// out from the chat's transcript each time a pane reads it, so the text never
// shows twice. The entry is a `user` entry that the transcript did not hold
// when the send started, whose text is the sent text as the server writes it
// (trimmed; a slash command's name and its words one space apart) and whose
// files are the sent files' names as the server stores them (`sentFileName`).
// A send that went through (204) drops "Sending…" and keeps the bubble until
// that entry comes, wherever it lands: a prompt sent while the chat works is
// written when Claude takes it, after replies that came meanwhile (backend
// #343). From `quietMs` after the 204 the next read of the transcript ends it
// too, as that read holds the prompt or the server lost it.
// A miss removes the bubble, and the composer puts the text back.
//
// A chat whose pane stops showing it (another chat opened, the pane closed, a
// /clear gave the pane a new chat) drops its pending send: the transcript read
// when it shows again holds the prompt, or the composer holds the text.
//
// Nothing here goes to report(), a log or the console: the bubble holds the
// owner's text and file names.
import type { TranscriptEntry } from '@bridge/contract'
import { sentFileName } from '@bridge/shared'
import { registerReset } from '../../state/resetStores.ts'
import type { PendingSendView } from './blocks/ChatPane.tsx'
import { subscribeTranscripts, transcriptReads, type TranscriptView, transcriptViews } from './liveTranscript.ts'

/** How long after the 204 a read of the transcript without the prompt's entry still keeps the bubble. */
export const quietMs = 10_000

type Pending = {
  /** The text as the transcript shows it, and the file names as the server stores them. */
  readonly match: { readonly text: string; readonly files: readonly string[] }
  /** The IDs of the user entries the chat's transcript held when the send started. */
  readonly before: ReadonlySet<string>
  /** The transcript was shown when the send started, or since: its end drops the send. */
  watched: boolean
  /** The read count once `quietMs` passed after the 204: a later read ends the send. */
  quietAt: number | undefined
  timer: ReturnType<typeof setTimeout> | undefined
  view: PendingSendView
}

/** The pending send of each chat, by its server ID: one at a time, as the composer sends one at a time. */
const pendings = new Map<string, Pending>()
const listeners = new Map<string, Set<() => void>>()

function tell(chat: string): void {
  for (const listener of [...(listeners.get(chat) ?? [])]) listener()
}

/** The text as the server writes a prompt to the transcript: trimmed, a slash command's name one space from its words. */
const promptText = (text: string): string => {
  const trimmed = text.trim()
  return trimmed.startsWith('/') ? trimmed.replace(/^(\/\S+)\s+/, '$1 ') : trimmed
}

const userIds = (view: TranscriptView | undefined): Set<string> =>
  new Set(view?.entries.flatMap((e) => (e.type === 'user' ? [e.id] : [])) ?? [])

const sameFiles = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((name, i) => name === b[i])

/** Whether `entry` is the prompt of `pending`: new since the send started, with its text and files. */
const isPrompt = (pending: Pending, entry: TranscriptEntry): boolean =>
  entry.type === 'user' &&
  !pending.before.has(entry.id) &&
  promptText(entry.text) === pending.match.text &&
  sameFiles(entry.files ?? [], pending.match.files)

/** Whether `pending` still shows, beside the chat's transcript `view` now. */
function shows(chat: string, pending: Pending, view: TranscriptView | undefined): boolean {
  if (view === undefined) return !pending.watched
  if (view.entries.some((entry) => isPrompt(pending, entry))) return false
  return pending.quietAt === undefined || transcriptReads(chat) <= pending.quietAt
}

function end(chat: string, pending: Pending): void {
  if (pendings.get(chat) !== pending) return
  clearTimeout(pending.timer)
  pendings.delete(chat)
  tell(chat)
}

// A transcript change ends each send it shows the prompt of, or whose chat no longer shows. The panes work the view
// out again themselves, so the bubble goes in the render that draws the entry, whichever listener runs first.
subscribeTranscripts(() => {
  const views = transcriptViews()
  for (const [chat, pending] of [...pendings]) {
    const view = views.get(chat)
    if (view !== undefined) pending.watched = true
    if (!shows(chat, pending, view)) end(chat, pending)
  }
})

/** What a send does with its bubble once the server answered. */
export type PendingSend = {
  /** The server took it (204): "Sending…" goes, and the bubble stays until the entry comes. */
  readonly sent: () => void
  /** It missed: the bubble goes. */
  readonly missed: () => void
}

/** Shows `text` with the files `files` (their names as chipped) as the pending send of the live chat `chat`. */
export function startPending(chat: string, text: string, files: readonly string[]): PendingSend {
  const earlier = pendings.get(chat)
  if (earlier !== undefined) clearTimeout(earlier.timer)
  const view = transcriptViews().get(chat)
  const pending: Pending = {
    match: { text: promptText(text), files: files.map(sentFileName) },
    before: userIds(view),
    watched: view !== undefined,
    quietAt: undefined,
    timer: undefined,
    view: { text, files: [...files], sending: true },
  }
  pendings.set(chat, pending)
  tell(chat)
  return {
    sent: () => {
      if (pendings.get(chat) !== pending) return
      pending.view = { ...pending.view, sending: false }
      tell(chat)
      pending.timer = setTimeout(() => {
        if (pendings.get(chat) === pending) pending.quietAt = transcriptReads(chat)
      }, quietMs)
    },
    missed: () => {
      end(chat, pending)
    },
  }
}

/** The pending send `chat`'s pane draws now; none when it has none or the transcript shows its entry already. */
export function pendingView(chat: string): PendingSendView | undefined {
  const pending = pendings.get(chat)
  if (pending === undefined) return undefined
  return shows(chat, pending, transcriptViews().get(chat)) ? pending.view : undefined
}

/** Calls `listener` after each change of `chat`'s pending send or of its transcript; the result stops it. */
export function subscribePending(chat: string, listener: () => void): () => void {
  const forChat = listeners.get(chat) ?? new Set()
  forChat.add(listener)
  listeners.set(chat, forChat)
  const stopTranscripts = subscribeTranscripts(listener)
  return () => {
    forChat.delete(listener)
    stopTranscripts()
  }
}

/** Ends every pending send, for a test's cleanup (`resetAllStores`). */
function resetPending() {
  for (const pending of pendings.values()) clearTimeout(pending.timer)
  pendings.clear()
}

registerReset(resetPending)
