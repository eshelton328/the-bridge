// The open item's discussion (D5, T5, M7): which discussion a layout shows,
// its messages after what the owner sent, and what closes it. Discuss opens it
// (`ui.discussOpen`); close (D5) and Back (T5, M7) close it, and so does
// opening another item, so the next item opens without it. Pure functions, no
// React.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitDiscussEntry, ToolkitDiscussion, ToolkitOpenItem, ToolkitUi } from '../types.ts'

/** The discussion an item shows on a layout: the layout's own, else the desktop's; none when the item has none. */
export function discussionOf(open: ToolkitOpenItem | null, layout: Viewport): ToolkitDiscussion | undefined {
  const discuss = open?.detail.discuss
  return discuss?.[layout] ?? discuss?.desktop
}

/** The discussion that shows: the open item's, while `ui.discussOpen` is set; none when it is closed or has none. */
export function openDiscussion(
  open: ToolkitOpenItem | null,
  ui: Pick<ToolkitUi, 'discussOpen'>,
  layout: Viewport,
): ToolkitDiscussion | undefined {
  return ui.discussOpen === true ? discussionOf(open, layout) : undefined
}

/** The messages the discussion shows: its entries, then the ones the owner sent. Nothing answers them in this mock-up. */
export function discussEntries(
  discussion: ToolkitDiscussion,
  ui: Pick<ToolkitUi, 'discussSent'>,
): ToolkitDiscussEntry[] {
  return [...discussion.entries, ...(ui.discussSent ?? []).map((text) => ({ type: 'user' as const, text }))]
}

/** The ui change of Discuss: on the desktop it toggles the panel (D5); elsewhere it opens the page (T5, M7). */
export function toggleDiscuss(ui: Pick<ToolkitUi, 'discussOpen'>, layout: Viewport): Partial<ToolkitUi> {
  return { discussOpen: layout === 'desktop' ? ui.discussOpen !== true : true }
}

/** The ui change of close (D5) and Back (T5, M7): the item shows alone again, and the draft stays. */
export function closeDiscuss(): Partial<ToolkitUi> {
  return { discussOpen: false }
}

/** The ui change of a sent message: it follows the others, and the reply box empties. */
export function sendDiscuss(ui: Pick<ToolkitUi, 'discussSent'>, text: string): Partial<ToolkitUi> {
  return { discussSent: [...(ui.discussSent ?? []), text], discussDraft: '' }
}

/**
 * A ui change, with the discussion closed and emptied when it opens another item or none (a card, a link, Back, Show
 * on map), so that item does not open on its own discussion with the last one's draft and messages.
 */
export function withDiscussReset(ui: Pick<ToolkitUi, 'open'>, change: Partial<ToolkitUi>): Partial<ToolkitUi> {
  if (!('open' in change) || change.open === ui.open) return change
  return { ...change, discussOpen: undefined, discussDraft: undefined, discussSent: undefined }
}
