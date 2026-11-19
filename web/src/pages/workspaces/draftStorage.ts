// The composer drafts that outlive a reload (audit W-10): Reload app, the
// way out of a fallback that keeps failing, would drop the drafts the page
// store holds in memory. WorkspacesPage saves them in sessionStorage by
// chat id, with the `?state=` they belong to, as each change comes in, and
// reads them back on load. Storage that is blocked or full keeps the
// drafts in memory only, as before. resetAllStores() clears them, as it
// clears the page store.
import { z } from 'zod'
import { registerReset } from '../../state/resetStores.ts'

const storageKey = 'bridge/workspaces/drafts'
const Saved = z.object({ state: z.string().nullable(), drafts: z.record(z.string(), z.string()) })
const none: Readonly<Record<string, string>> = {}

/** The drafts saved in this tab for `state` (undefined is the default state), by chat id; empty when there are none. */
export function loadDrafts(state: string | undefined): Readonly<Record<string, string>> {
  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (raw === null) return none
    const saved = Saved.safeParse(JSON.parse(raw))
    return saved.success && saved.data.state === (state ?? null) ? saved.data.drafts : none
  } catch {
    return none
  }
}

/** Saves `drafts` of `state` for this tab; does nothing when storage is blocked or full. */
export function saveDrafts(state: string | undefined, drafts: Readonly<Record<string, string>>): void {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify({ state: state ?? null, drafts }))
  } catch {
    // Blocked or full: the drafts stay in memory only.
  }
}

registerReset(() => {
  try {
    window.sessionStorage.removeItem(storageKey)
  } catch {
    // Blocked: nothing was saved.
  }
})
