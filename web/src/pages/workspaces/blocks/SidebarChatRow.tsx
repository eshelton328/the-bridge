// One chat in the workspace sidebar (D2 105:643): the kind mark, the title,
// the model and context used, and the status. A subtask's chat is indented
// under the chat that started it (199:51). The row of a chat Erik drags
// onto the chat shown alone fades (D6 158:750). Props only.
import { ContextMeter, Inline, KindMark, ListRow, StatusPill } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarChat } from '../types.ts'

// D6 158:750: the dragged chat's own row fades; `opacity.disabled` is the nearest token to Figma's look (d-100).
const faded = css({ opacity: 'disabled' })

export type SidebarChatRowProps = {
  chat: SidebarChat
  /** The Figma layer the row stands for, for the fidelity checks. */
  figma?: string | undefined
  /** The chat in the middle of the screen. */
  selected?: boolean | undefined
  /** The chat is being dragged from this row: the row fades (D6). */
  moving?: boolean | undefined
  onSelect?: (() => void) | undefined
}

export function SidebarChatRow({ chat, figma, selected, moving, onSelect }: SidebarChatRowProps) {
  return (
    <div data-figma={figma} className={moving === true ? faded : undefined}>
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
        level={chat.level}
        onSelect={onSelect}
      />
    </div>
  )
}
