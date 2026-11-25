// A live Claude chat's terminal dialog (R69): a dialog on the chat's screen
// that its transcript does not hold, such as a skill's numbered "Send this to
// Claude?" step. The page reads it (liveDialogs.ts) only while the chat needs
// the owner and its transcript has no open question; the pane draws it as a
// card (DialogCard) and sends an option only on the owner's tap. The types
// and the pane's rule are here; this file has no live code.
import type { PaneDialog } from '@bridge/contract'
import type { ChatEntry, WorkbenchPane } from '../types.ts'

/**
 * Where an answer to the shown dialog stands: none sent (`ready`), on its way (`sending`), taken (`sent`), refused as
 * the terminal changed (`changed`, 409), or missed (`failed`, with its line and Retry when `retry`).
 */
export type DialogPhase = 'ready' | 'sending' | 'sent' | 'changed' | 'failed'

/** What a chat's card shows now: the dialog of the last read that showed one, and its answer's phase. */
export type DialogView = {
  readonly dialog: PaneDialog
  readonly phase: DialogPhase
  /** The failed answer's line, such as "Not sent — unreachable"; none in another phase. */
  readonly line?: string | undefined
  /** The failed answer may work later: the line has Retry. */
  readonly retry?: boolean | undefined
}

/** A live chat's dialog, for its pane: the pane reads the view itself, so a change renders only the card. */
export type ChatDialog = {
  /** Calls `listener` after each change of the chat's dialog or answer; the result stops it. */
  readonly subscribe: (listener: () => void) => () => void
  /** The card to draw now; none when the last read showed no dialog or none came yet. One object until it changes. */
  readonly view: () => DialogView | undefined
  /** Reads the dialog now and every few seconds while the pane shows a blocked chat; the result stops the reads. */
  readonly watch: () => () => void
  /** Sends the option numbered `n` of the shown dialog: the owner tapped it. */
  readonly answer: (n: number) => void
  /** Sends the failed answer again. */
  readonly retry: () => void
}

/** The tool an open question of the transcript runs: Claude Code's own question card. */
const questionTool = 'AskUserQuestion'

/** The transcript asks the owner a question now: its question tool still runs, so the transcript shows it. */
export const hasOpenQuestion = (entries: readonly ChatEntry[]): boolean =>
  entries.some((e) => e.type === 'tool' && e.name === questionTool && e.running === true)

/** The dialog source of `pane`'s chat while it needs the owner; none while it does not, or for a sample chat. */
export function blockedDialog(
  pane: Extract<WorkbenchPane, { type: 'chat' }>,
  dialogOf: ((chat: string) => ChatDialog | undefined) | undefined,
): ChatDialog | undefined {
  return pane.head.status.tone === 'needsYou' ? dialogOf?.(pane.id) : undefined
}
