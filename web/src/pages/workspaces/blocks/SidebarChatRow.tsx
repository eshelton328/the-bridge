// One chat in the workspace sidebar (D2 105:643): the kind mark, the title,
// the model and context used, and the status. A subtask's chat is indented
// under the chat that started it (199:51). Props only.
import { ContextMeter, Inline, KindMark, ListRow, StatusPill } from '@eshelton328/component-library-1701'
import type { SidebarChat } from '../types.ts'

export type SidebarChatRowProps = {
  chat: SidebarChat
  /** The Figma layer the row stands for, for the fidelity checks. */
  figma?: string | undefined
  /** The chat in the middle of the screen. */
  selected?: boolean | undefined
  /** The row is a chat Erik drags: it has the selected colours. */
  dragged?: boolean | undefined
  onSelect?: (() => void) | undefined
}

export function SidebarChatRow({ chat, figma, selected, dragged, onSelect }: SidebarChatRowProps) {
  return (
    <div data-figma={figma}>
      <ListRow
        variant="sidebar"
        density="compact"
        title={chat.title}
        leading={<KindMark kind={chat.kind} size="16" />}
        meta={
          <Inline gap="4" align="center">
            <span>{chat.model}</span>
            {/* d-100: a context of 75 or more is drawn in amber, as on the empty pane of D1. */}
            {chat.context === undefined ? null : <ContextMeter value={chat.context} high={chat.context >= 75} />}
          </Inline>
        }
        trailing={<StatusPill label={chat.status.label} tone={chat.status.tone} dot />}
        selected={selected}
        running={dragged}
        level={chat.level}
        onSelect={onSelect}
      />
    </div>
  )
}
