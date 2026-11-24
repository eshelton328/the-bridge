// A reply that a Stop hook sent back (R62, the owner: "duplicate output. this
// is a big no no"). The chat writes the reply again after the hook's note, so
// the transcript holds the draft and the rewrite; the server marks the draft
// with `replacedBy`, the ID of the rewrite (backend #470). A draft whose
// rewrite is in the transcript does not show as a reply of its own: the
// rewrite carries it, and the page draws a note on the rewrite whose tap shows
// it. A draft whose rewrite is not in the transcript (not yet come, or before
// the 500 the server sends) shows as a reply. With several rejections in a
// row, each draft names the next reply, and the last reply carries them all,
// oldest first. Pure.
import type { TranscriptEntry } from '@bridge/contract'

type AssistantEntry = Extract<TranscriptEntry, { type: 'assistant' }>

/** An entry as the page shows it: a reply carries the drafts it replaced, oldest first. */
export type FoldedEntry = { readonly entry: TranscriptEntry; readonly drafts: readonly AssistantEntry[] }

/** `entries` with each draft whose rewrite is there folded into that rewrite, in transcript order. */
export function foldDrafts(entries: readonly TranscriptEntry[]): FoldedEntry[] {
  const replies = new Map<string, AssistantEntry>()
  for (const entry of entries) if (entry.type === 'assistant') replies.set(entry.id, entry)
  // The reply that shows in place of `draft`: the end of its chain of rewrites that the transcript holds.
  const shownFor = (draft: AssistantEntry): AssistantEntry => {
    const seen = new Set([draft.id])
    let at = draft
    for (;;) {
      const next = at.replacedBy === undefined ? undefined : replies.get(at.replacedBy)
      if (next === undefined) return at
      // A loop of marks has no last reply: each of its replies shows as it is.
      if (seen.has(next.id)) return draft
      seen.add(next.id)
      at = next
    }
  }
  const carried = new Map<string, AssistantEntry[]>()
  const folded = new Set<string>()
  for (const reply of replies.values()) {
    const shown = shownFor(reply)
    if (shown === reply) continue
    folded.add(reply.id)
    carried.set(shown.id, [...(carried.get(shown.id) ?? []), reply])
  }
  return entries
    .filter((entry) => !folded.has(entry.id))
    .map((entry) => ({ entry, drafts: carried.get(entry.id) ?? [] }))
}
