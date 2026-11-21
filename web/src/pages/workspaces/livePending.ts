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
// /clear gave the pane a new chat) drops its pending sends: the transcript read
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
  /** The IDs of the user entries the chat's transcript held when the send started, and those earlier sends took. */
  readonly before: Set<string>
  /** The transcript was shown when the send started, or since: its end drops the send. */
  watched: boolean
  /** The read count once `quietMs` passed after the 204: a later read ends the send. */
  quietAt: number | undefined
  timer: ReturnType<typeof setTimeout> | undefined
  view: PendingSendView
}

/**
 * The pending sends of each chat, by its server ID, in the order sent: the composer sends one at a time, but a send
 * that went through waits for its entry while the next one goes.
 */
const pendings = new Map<string, readonly Pending[]>()
const listeners = new Map<string, Set<() => void>>()
/** The key of the last send, so each bubble keeps its own while others come and go. */
let seq = 0

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

/**
 * The sends of `chat` that still show beside its transcript `view` now. In the order sent, each send takes the first
 * entry that is its prompt and that no earlier send took, so two sends of the same text wait for two entries.
 */
function shown(chat: string, sends: readonly Pending[], view: TranscriptView | undefined, taken = new Set<string>()) {
  return sends.filter((pending) => {
    if (view === undefined) return !pending.watched
    const entry = view.entries.find((e) => !taken.has(e.id) && isPrompt(pending, e))
    if (entry !== undefined) {
      taken.add(entry.id)
      return false
    }
    return pending.quietAt === undefined || transcriptReads(chat) <= pending.quietAt
  })
}

function end(chat: string, ended: readonly Pending[]): void {
  const sends = pendings.get(chat) ?? []
  const left = sends.filter((pending) => !ended.includes(pending))
  if (left.length === sends.length) return
  for (const pending of ended) clearTimeout(pending.timer)
  if (left.length === 0) pendings.delete(chat)
  else pendings.set(chat, left)
  tell(chat)
}

// A transcript change ends each send it shows the prompt of, or whose chat no longer shows. The panes work the view
// out again themselves, so the bubble goes in the render that draws the entry, whichever listener runs first.
subscribeTranscripts(() => {
  const views = transcriptViews()
  for (const [chat, sends] of [...pendings]) {
    const view = views.get(chat)
    if (view !== undefined) for (const pending of sends) pending.watched = true
    const taken = new Set<string>()
    const still = shown(chat, sends, view, taken)
    // An entry an ended send took stays taken for the sends that wait on.
    for (const pending of still) for (const id of taken) pending.before.add(id)
    end(
      chat,
      sends.filter((pending) => !still.includes(pending)),
    )
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
  const view = transcriptViews().get(chat)
  const pending: Pending = {
    match: { text: promptText(text), files: files.map(sentFileName) },
    before: userIds(view),
    watched: view !== undefined,
    quietAt: undefined,
    timer: undefined,
    view: { key: String(++seq), text, files: [...files], sending: true },
  }
  pendings.set(chat, [...(pendings.get(chat) ?? []), pending])
  tell(chat)
  const live = () => pendings.get(chat)?.includes(pending) === true
  return {
    sent: () => {
      if (!live()) return
      pending.view = { ...pending.view, sending: false }
      tell(chat)
      pending.timer = setTimeout(() => {
        if (live()) pending.quietAt = transcriptReads(chat)
      }, quietMs)
    },
    missed: () => {
      end(chat, [pending])
    },
  }
}

const noViews: readonly PendingSendView[] = []
/** The last list each chat's pane read, so a read that finds the same sends gives the same array. */
const lastViews = new Map<string, readonly PendingSendView[]>()

/** The pending sends `chat`'s pane draws now, in the order sent: those whose entry the transcript does not show yet. */
export function pendingViews(chat: string): readonly PendingSendView[] {
  const sends = pendings.get(chat)
  if (sends === undefined) return noViews
  const now = shown(chat, sends, transcriptViews().get(chat)).map((pending) => pending.view)
  const last = lastViews.get(chat)
  if (last?.length === now.length && last.every((view, i) => view === now[i])) return last
  const next = now.length === 0 ? noViews : now
  lastViews.set(chat, next)
  return next
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
  for (const sends of pendings.values()) for (const pending of sends) clearTimeout(pending.timer)
  pendings.clear()
  lastViews.clear()
}

registerReset(resetPending)
