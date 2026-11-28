// A chat pane's transcript watch that outlives the pane for the remount grace
// (lib/remountGrace.ts, NCC-175): on the desktop's sidebar Hide or Show the
// chat's pane unmounts and the other layout's pane of the same chat mounts in
// the same commit. The new pane takes the old watch over, so the stream stays
// open and the transcript is not read again. A pane that closes for good
// stops its watch at the end of the grace, so liveTranscript.ts closes the
// stream then, as before.
import { afterRemountGrace } from '../../lib/remountGrace.ts'

type Watch = (chat: string) => () => void

/** `watch`, with each stop held for the remount grace and taken over by the next watch of the same chat in it. */
export function keptAcrossRemount(watch: Watch): Watch {
  const leaving = new Map<string, { readonly stop: () => void; readonly keep: () => boolean }>()
  return (chat) => {
    const left = leaving.get(chat)
    leaving.delete(chat)
    const stop = left?.keep() === true ? left.stop : watch(chat)
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      const entry = {
        stop,
        keep: afterRemountGrace(() => {
          if (leaving.get(chat) === entry) leaving.delete(chat)
          stop()
        }),
      }
      leaving.set(chat, entry)
    }
  }
}
