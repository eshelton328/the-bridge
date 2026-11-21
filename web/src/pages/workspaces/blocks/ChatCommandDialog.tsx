// The dialog of the command picked in a live Claude chat's actions (W5,
// `ui.chatDialog`): CompactDialog for /compact, ClearContextDialog for
// /clear, for the chat the actions belong to; none for any other dialog or
// with no chat. Each starts afresh when it opens. Props only.
import type { WorkspacesUi } from '../types.ts'
import { ClearContextDialog } from './ClearContextDialog.tsx'
import { CompactDialog } from './CompactDialog.tsx'
import type { RunCommand } from './useCommandRun.ts'

export type ChatCommandDialogProps = {
  dialog: WorkspacesUi['chatDialog']
  /** The chat's name; none when no chat shows. */
  chat: string | undefined
  onOpenChange: (open: boolean) => void
  onRun?: RunCommand | undefined
}

export function ChatCommandDialog({ dialog, chat, onOpenChange, onRun }: ChatCommandDialogProps) {
  if (chat === undefined) return null
  if (dialog === 'compact') return <CompactDialog chat={chat} onOpenChange={onOpenChange} onRun={onRun} />
  if (dialog === 'clear') return <ClearContextDialog chat={chat} onOpenChange={onOpenChange} onRun={onRun} />
  return null
}
