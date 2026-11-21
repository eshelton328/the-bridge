// A live send that a reload cut off (backend #369, the P2 of #348): the box
// empties as a send starts, so a reload before the server answers would lose
// the text. The page keeps each unanswered send in sessionStorage beside the
// drafts (draftStorage.ts) and, on load, reads what became of it with its
// send ID (`readSendResult`):
// - `pending`: the server still sends it; read again 1.5 s later, at most
//   `pendingReads` times, then treat it as `unknown`.
// - `sent`: forget it; the transcript shows the prompt.
// - `notSent`, `notSubmitted`: put the text back in the box, before any newer
//   draft (`DraftBook.restore`), with the line a miss of that kind shows.
// - `unknown`, a 404 (the server keeps no result: a restart, or older than
//   `sendResultMs`), or a send older than `sendResultMs` (with no read): put
//   the text back with "This message may have been sent", so the owner looks
//   before he sends it again.
// - no answer: keep it and read again the next time its chat opens, or after
//   the next load.
// A send whose request got no answer is kept too, marked `restored`: the
// composer put its text back in the draft, while the server may have taken
// it. A reload ends the request so, in the second before the page goes. Its
// read takes the text back out of the draft when it was `sent`; any other
// result shows its line, and puts the text back only when the draft does not
// hold it already. One whose text the owner changed or cleared since is
// forgotten with no read, as is each one of a chat when it sends again.
// The page never sends it again itself. Nothing here goes to report(), a log
// or the console: a kept send holds the owner's text and file names.
import { sendResultMs } from '@bridge/contract'
import { registerReset } from '../../state/resetStores.ts'
import type { ComposerNotice } from './blocks/ChatPane.tsx'
import { type DraftBook, holdsSent } from './blocks/draftBook.ts'
import { dropSend, type KeptSend, loadSends, sendsToRead } from './draftStorage.ts'
import { showNotice } from './livePending.ts'
import { readSendResult } from './liveSend.ts'
import { subscribeTranscripts, transcriptViews } from './liveTranscript.ts'

/** How long to wait before reading a `pending` result again. */
const pendingReadMs = 1500
/** How many times a `pending` result is read before the page treats the send as `unknown`. */
const pendingReads = 5

const maybeSent: ComposerNotice = { line: 'This message may have been sent', retry: false }
/** The line of each result that did not reach the chat: the line a miss of that kind shows (liveSend.ts). */
const notReached: Record<'notSent' | 'notSubmitted', ComposerNotice> = {
  notSent: { line: 'Not sent — chat not ready', retry: false },
  notSubmitted: { line: 'Not sent — the chat did not take the message', retry: true },
}

/** The sends being read now, by send ID, so a second load or a chat opening does not read one twice. */
const reading = new Set<string>()
/** The sends whose read got no answer, by their chat's server ID: read again when that chat opens. */
const failed = new Map<string, Set<KeptSend>>()
/** The chats that showed at the last transcript change, so a chat that opens is told from one that stays. */
let shownChats = new Set<string>()
let generation = 0

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

/** Puts the text of `send` back in its chat's box, unless it is there, with `notice`; then forgets the send. */
function restore(state: string | undefined, drafts: DraftBook, send: KeptSend, notice: ComposerNotice): void {
  if (/\S/.test(send.text) && !holdsSent(drafts.get(send.chat) ?? '', send.text)) drafts.restore(send.chat, send.text)
  showNotice(send.liveChat, notice)
  dropSend(state, send.sendId)
}

/** Reads what became of `send` and acts on it; a read with no answer keeps it for the next time its chat opens. */
async function settle(state: string | undefined, drafts: DraftBook, send: KeptSend, now: number): Promise<void> {
  if (reading.has(send.sendId)) return
  // The owner changed or cleared the text put back after no answer: he has dealt with it.
  if (send.restored === true && /\S/.test(send.text) && !holdsSent(drafts.get(send.chat) ?? '', send.text)) {
    dropSend(state, send.sendId)
    return
  }
  const started = generation
  if (now - send.at >= sendResultMs) {
    restore(state, drafts, send, maybeSent)
    return
  }
  reading.add(send.sendId)
  try {
    for (let read = 1; ; read += 1) {
      const result = await readSendResult(send.liveChat, send.sendId)
      // resetAllStores ended this page's life meanwhile.
      if (started !== generation) return
      if (result === 'pending' && read < pendingReads) {
        await wait(pendingReadMs)
        if (started !== generation) return
        continue
      }
      // The owner sent the chat again meanwhile, which settles a restored send, or another read settled it.
      if (!stillKept(state, send.sendId)) return
      if (result === 'failed') {
        const forChat = failed.get(send.liveChat) ?? new Set()
        forChat.add(send)
        failed.set(send.liveChat, forChat)
        return
      }
      if (result === 'sent') {
        // The chat has it: a text put back after no answer leaves the draft, so it does not show twice.
        if (send.restored === true && /\S/.test(send.text)) drafts.withdraw(send.chat, send.text)
        dropSend(state, send.sendId)
      } else if (result === 'notSent' || result === 'notSubmitted') restore(state, drafts, send, notReached[result])
      else restore(state, drafts, send, maybeSent)
      return
    }
  } finally {
    reading.delete(send.sendId)
  }
}

/** Whether `sendId` is still kept for `state`. */
const stillKept = (state: string | undefined, sendId: string) => loadSends(state).some((send) => send.sendId === sendId)

let stopWatch: (() => void) | undefined

/**
 * Reads the result of each send of `state` that had no answer before this load, into `drafts`. A send whose read got no
 * answer is read again when its chat opens.
 */
export function recoverSends(state: string | undefined, drafts: DraftBook): void {
  const now = Date.now()
  for (const send of sendsToRead(state)) void settle(state, drafts, send, now)
  stopWatch?.()
  shownChats = new Set(transcriptViews().keys())
  stopWatch = subscribeTranscripts(() => {
    const views = transcriptViews()
    const opened = [...views.keys()].filter((chat) => !shownChats.has(chat))
    shownChats = new Set(views.keys())
    for (const chat of opened) {
      const sends = failed.get(chat)
      if (sends === undefined) continue
      failed.delete(chat)
      // Only the sends still kept: another tab's load, or this one's, may have settled them.
      const kept = new Set(loadSends(state).map((send) => send.sendId))
      for (const send of sends) if (kept.has(send.sendId)) void settle(state, drafts, send, Date.now())
    }
  })
}

registerReset(() => {
  generation += 1
  stopWatch?.()
  stopWatch = undefined
  reading.clear()
  failed.clear()
  shownChats = new Set()
})
