// The composer drafts that outlive a reload (audit W-10): Reload app, the
// way out of a fallback that keeps failing, would drop the drafts the page
// store holds in memory. WorkspacesPage saves them in sessionStorage by
// chat id, with the `?state=` they belong to, as each change comes in, and
// reads them back on load. Storage that is blocked or full keeps the
// drafts in memory only, as before, and a failed write or removal goes to
// report() (d-115). resetAllStores() clears them, as it clears the page store.
//
// Beside the drafts it keeps each live send that has no answer yet (backend
// #369): the chat, the server's chat ID, the page's send ID, the text, the
// file names (never a file's bytes) and when it started. A reload in that
// second ends the page's request, so the page reads the send's result on load
// and puts the text back when it did not reach the chat (keptSends.ts). A
// send leaves as it gets its answer or its transcript entry.
import { z } from 'zod'
import { report } from '../../errors/reporter.ts'
import { registerReset } from '../../state/resetStores.ts'

const storageKey = 'bridge/workspaces/drafts'

/** A live send with no answer yet, kept so a reload can read its result. */
export const KeptSend = z.object({
  /** The chat's id on the page: its draft's key. */
  chat: z.string(),
  /** The chat's server ID, for the result read. */
  liveChat: z.string(),
  sendId: z.string(),
  text: z.string(),
  /** The names of the files sent, as chipped. */
  files: z.array(z.string()),
  /** When the send started, in ms since the epoch. */
  at: z.number(),
})
export type KeptSend = z.infer<typeof KeptSend>

/** A new send ID (backend #369): 32 hex digits from `getRandomValues`, which, unlike `randomUUID`, works over http. */
export function newSendId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const Saved = z.object({
  state: z.string().nullable(),
  drafts: z.record(z.string(), z.string()),
  sends: z.array(KeptSend).optional(),
})
type Saved = z.infer<typeof Saved>
const none: Readonly<Record<string, string>> = {}
const noSends: readonly KeptSend[] = []

/** What this tab saved for `state`; undefined when it saved nothing for it. */
function savedFor(state: string | undefined): Saved | undefined {
  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (raw === null) return undefined
    const saved = Saved.safeParse(JSON.parse(raw))
    return saved.success && saved.data.state === (state ?? null) ? saved.data : undefined
  } catch {
    return undefined
  }
}

/**
 * Saves the drafts that hold text and the kept sends of `state`, nothing else; with neither, the key goes. When storage
 * is blocked or full, they stay in memory and report() gets the error.
 */
function write(state: string | undefined, drafts: Readonly<Record<string, string>>, sends: readonly KeptSend[]): void {
  const kept = Object.fromEntries(Object.entries(drafts).filter(([, text]) => text !== ''))
  try {
    if (Object.keys(kept).length === 0 && sends.length === 0) window.sessionStorage.removeItem(storageKey)
    else
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ state: state ?? null, drafts: kept, ...(sends.length === 0 ? {} : { sends }) }),
      )
  } catch (error) {
    // Blocked or full: the drafts stay in memory only.
    report(error, 'handler')
  }
}

/** The drafts saved in this tab for `state` (undefined is the default state), by chat id; empty when there are none. */
export function loadDrafts(state: string | undefined): Readonly<Record<string, string>> {
  return savedFor(state)?.drafts ?? none
}

/**
 * Saves the drafts of `state` that hold text for this tab: the composer text by chat id and the state's name, nothing
 * else. A chat whose box is empty, as after a send, has no saved draft. The kept sends stay.
 */
export function saveDrafts(state: string | undefined, drafts: Readonly<Record<string, string>>): void {
  write(state, drafts, savedFor(state)?.sends ?? noSends)
}

/** The live sends of `state` that had no answer when this tab saved them, in the order sent. */
export function loadSends(state: string | undefined): readonly KeptSend[] {
  return savedFor(state)?.sends ?? noSends
}

/** Keeps `send` until its answer or its entry comes (`dropSend`). */
export function keepSend(state: string | undefined, send: KeptSend): void {
  const saved = savedFor(state)
  write(state, saved?.drafts ?? none, [...(saved?.sends ?? noSends), send])
}

/** Forgets the kept send `sendId`; nothing when it is not kept. */
export function dropSend(state: string | undefined, sendId: string): void {
  const saved = savedFor(state)
  if (saved?.sends?.some((send) => send.sendId === sendId) !== true) return
  write(
    state,
    saved.drafts,
    saved.sends.filter((send) => send.sendId !== sendId),
  )
}

registerReset(() => {
  try {
    window.sessionStorage.removeItem(storageKey)
  } catch (error) {
    // Blocked: nothing was saved.
    report(error, 'handler')
  }
})
